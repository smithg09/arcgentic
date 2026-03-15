"""
Flask API for the multi-agent learning resource generator.

Endpoints:
    GET  /api/health                    — Health check
    POST /api/sessions                  — Create a new session
    POST /api/sessions/<id>/chat        — Send message (text + optional PDFs/URLs)
    GET  /api/sessions/<id>/resources   — Get all generated content
    GET  /api/sessions/<id>/resources/<type> — Get a specific resource
"""

from __future__ import annotations

import asyncio
import os
import uuid

from flask import Flask, jsonify, request, Response, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv
import json
from langchain_core.messages import HumanMessage

from agent.graph import create_graph
from agent.db import get_checkpointer
from agent.state import LearningSpec
from agent.parsers import parse_user_input

# Load .env relative to this file
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────────────────────────────────
# Graph + Checkpointer singleton (lazy init)
# ─────────────────────────────────────────────────────────────────────
# ─────────────────────────────────────────────────────────────────────
# Graph + Checkpointer singleton (lazy init)
# ─────────────────────────────────────────────────────────────────────
_graph = None
_checkpointer = None


_graph_cache = {}

async def get_graph():
    """Get or initialize the graph in the current event loop."""
    global _graph_cache
    loop = asyncio.get_running_loop()
    
    # Check if we already have a graph for this loop
    if loop in _graph_cache:
        return _graph_cache[loop]
        
    db_url = os.getenv("DATABASE_URL", "postgresql://aiproject:aiproject@127.0.0.1:5433/aiproject")
    print(f"DEBUG: Connecting to Postgres at: {db_url}")

    try:
        checkpointer = await get_checkpointer(db_url)
        graph = create_graph(checkpointer=checkpointer)
        _graph_cache[loop] = graph
        print(f"DEBUG: Postgres checkpointer initialized successfully for loop {id(loop)}!")
        return graph
    except Exception as e:
        print(f"Warning: Could not connect to Postgres: {e}")
        print("Running without persistence (in-memory only)")
        graph = create_graph(checkpointer=None)
        _graph_cache[loop] = graph
        return graph


# ─────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "service": "ai-learning-agent"})


@app.route("/api/sessions", methods=["POST"])
def create_session():
    """Create a new session and return the session ID."""
    session_id = str(uuid.uuid4())
    return jsonify({
        "session_id": session_id,
        "status": "created",
    }), 201


@app.route("/api/sessions/<session_id>/chat", methods=["POST"])
async def chat(session_id: str):
    """
    Send a message to the agent.
    """
    graph = await get_graph()

    # Parse input — supports both JSON and multipart form
    if request.content_type and "multipart/form-data" in request.content_type:
        message = request.form.get("message", "")
        urls_str = request.form.get("urls", "")
        urls = [u.strip() for u in urls_str.split(",") if u.strip()] if urls_str else []
        files = []
        for f in request.files.getlist("files"):
            files.append((f.filename, f.read()))
    else:
        # Check if it's JSON
        data = request.get_json(silent=True) or {}
        message = data.get("message", "")
        urls = data.get("urls", [])
        files = []

    if not message:
        return jsonify({"error": "Message is required"}), 400

    # Parse sources from PDFs/URLs
    sources = parse_user_input(files=files if files else None, urls=urls if urls else None)

    # Build initial state for new sessions or update existing
    config = {"configurable": {"thread_id": session_id}}

    # Prepare the input
    input_state = {
        "messages": [HumanMessage(content=message)],
        "session_id": session_id,
    }

    # If sources were provided, update the spec with them
    if sources:
        input_state["spec"] = LearningSpec(sources=sources)

    # Build generator for SSE
    async def generate_response():
        try:
            # Use an async iterator to allow heartbeat injection
            event_iterator = graph.astream_events(input_state, config=config, version="v2").__aiter__()
            
            while True:
                try:
                    # Wait for an event with a timeout for heartbeats
                    # 15 seconds is usually safe for most proxies/gateways
                    event = await asyncio.wait_for(event_iterator.__anext__(), timeout=15.0)
                    
                    kind = event["event"]
                    name = event["name"]
                    
                    # Stream content chunks generated by LLM from agent nodes
                    if kind == "on_chat_model_stream" and name in ["ChatOpenAI", "ChatGoogleGenerativeAI"]:
                        content = event["data"]["chunk"].content
                        if content:
                            if isinstance(content, list) and len(content) > 0 and isinstance(content[0], dict):
                                text = content[0].get("text", "")
                                if text:
                                    yield f"data: {json.dumps({'type': 'token', 'content': text})}\n\n"
                            elif isinstance(content, str):
                                yield f"data: {json.dumps({'type': 'token', 'content': content})}\n\n"
                    
                    # Optionally emit node start events
                    elif kind == "on_chain_start" and event.get("metadata", {}).get("langgraph_node", ""):
                        node = event['metadata']['langgraph_node']
                        if node != "__start__":
                             yield f"data: {json.dumps({'type': 'node_start', 'node': node})}\n\n"

                except asyncio.TimeoutError:
                    # Send a heartbeat to keep the connection alive
                    yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
                except StopAsyncIteration:
                    break

            # Get final state to send as the complete event
            state = await graph.aget_state(config)
            
            # Format the final state dictionary
            final_data = {
                 "type": "complete",
                 "state": {
                     "current_agent": state.values.get("current_agent", "unknown"),
                     "resources_ready": list(state.values.get("content", {}).keys()),
                     "resources_count": len(state.values.get("content", {})),
                 }
            }
            spec = state.values.get("spec")
            if spec:
                 final_data["state"]["spec"] = spec.model_dump()
                 
            # Extract last message
            messages = state.values.get("messages", [])
            last_message = messages[-1].content if messages else "No response"
            final_data["state"]["response"] = last_message
            
            yield f"data: {json.dumps(final_data)}\n\n"
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            
        yield "event: end\ndata: {}\n\n"

    # Bridge the async generator to a synchronous one for Flask's Response
    @stream_with_context
    def stream_generator():
        # Create a dedicated event loop for this stream to avoid lock issues
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            gen = generate_response()
            while True:
                try:
                    # Run the next iteration of the async generator in the local loop
                    chunk = loop.run_until_complete(gen.__anext__())
                    yield chunk
                except StopAsyncIteration:
                    break
        finally:
            loop.close()

    return Response(stream_generator(), mimetype='text/event-stream')


@app.route("/api/sessions/<session_id>", methods=["GET"])
async def get_session(session_id: str):
    """
    Get the full state of a session.

    Returns all graph state: messages, spec, content (resources),
    sources, todos, and memory.
    """
    graph = await get_graph()
    config = {"configurable": {"thread_id": session_id}}

    try:
        state = await graph.aget_state(config)

        if not state.values:
            return jsonify({
                "session_id": session_id,
                "exists": False,
                "message": "Session not found or has no state yet.",
            }), 404

        values = state.values

        # Serialize messages to dicts
        messages = []
        for msg in values.get("messages", []):
            messages.append({
                "role": "user" if msg.__class__.__name__ == "HumanMessage" else "assistant",
                "content": msg.content,
            })

        # Serialize spec
        spec = values.get("spec")
        spec_data = spec.model_dump() if spec else None

        # Extract sources from spec if present
        sources = []
        if spec_data and spec_data.get("sources"):
            sources = spec_data["sources"]

        # Serialize content/resources
        content = values.get("content", {})
        resources = {}
        for key, val in content.items():
            resources[key] = {
                "path": val.get("path", key),
                "content": val.get("content", ""),
                "size": len(val.get("content", "")),
            }

        return jsonify({
            "session_id": session_id,
            "exists": True,
            "current_agent": values.get("current_agent", "unknown"),
            "messages": messages,
            "spec": spec_data,
            "sources": sources,
            "resources": resources,
            "resources_count": len(resources),
            "todos": values.get("todos", []),
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/sessions/<session_id>/resources", methods=["GET"])
async def get_resources(session_id: str):
    """Get all generated resources for a session."""
    graph = await get_graph()
    config = {"configurable": {"thread_id": session_id}}

    try:
        state = await graph.aget_state(config)
        content = state.values.get("content", {})
        spec = state.values.get("spec")

        resources = {}
        for key, value in content.items():
            resources[key] = {
                "path": value.get("path", key),
                "content": value.get("content", ""),
                "size": len(value.get("content", "")),
            }

        return jsonify({
            "session_id": session_id,
            "resources": resources,
            "resources_count": len(resources),
            "spec": spec.model_dump() if spec else None,
        })
    except Exception as e:
        return jsonify({
            "session_id": session_id,
            "resources": {},
            "resources_count": 0,
            "error": str(e),
        })


@app.route("/api/sessions/<session_id>/resources/<resource_type>", methods=["GET"])
async def get_resource(session_id: str, resource_type: str):
    """Get a specific resource by type."""
    graph = await get_graph()
    config = {"configurable": {"thread_id": session_id}}

    try:
        state = await graph.aget_state(config)
        content = state.values.get("content", {})

        if resource_type not in content:
            available = list(content.keys())
            return jsonify({
                "error": f"Resource '{resource_type}' not found",
                "available": available,
            }), 404

        resource = content[resource_type]
        return jsonify({
            "resource_type": resource_type,
            "path": resource.get("path", resource_type),
            "content": resource.get("content", ""),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
