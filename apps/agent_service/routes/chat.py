"""Chat SSE streaming endpoint."""

from __future__ import annotations

import asyncio
import json

from flask import Blueprint, Response, jsonify, request
from langchain_core.messages import HumanMessage

from config import get_graph
from agent.state import LearningSpec
from agent.parsers import parse_user_input
from agent.model_provider import ModelConfig, NoProviderConfiguredError
from agent.builder_runner import builder_runner
from middleware.request_parser import parse_chat_request
from utils.sse import (
    create_sync_stream,
    format_sse,
    format_sse_end,
    handle_chat_model_stream,
    handle_tool_end,
)

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/api/sessions/<session_id>/chat", methods=["POST"])
async def chat(session_id: str):
    """Send a message to the agent and stream the response via SSE."""
    graph = await get_graph()

    parsed = parse_chat_request(request)

    if not parsed.message:
        return jsonify({"error": "Message is required"}), 400

    # Parse uploaded sources
    sources = parse_user_input(
        files=parsed.files if parsed.files else None,
        urls=parsed.urls if parsed.urls else None,
    )

    config = {"configurable": {"thread_id": session_id}}

    input_state = {
        "messages": [HumanMessage(content=parsed.message)],
        "session_id": session_id,
    }

    if parsed.model_config_raw and isinstance(parsed.model_config_raw, dict):
        config["configurable"]["model_config"] = parsed.model_config_raw

    if sources:
        input_state["spec"] = LearningSpec(sources=sources)

    # Async SSE generator
    async def generate_response():
        try:
            event_iterator = graph.astream_events(
                input_state, config=config, version="v2"
            ).__aiter__()
            next_event_task = asyncio.create_task(event_iterator.__anext__())

            while True:
                done, _ = await asyncio.wait([next_event_task], timeout=15.0)

                if next_event_task in done:
                    try:
                        event = next_event_task.result()
                        next_event_task = asyncio.create_task(
                            event_iterator.__anext__()
                        )
                    except StopAsyncIteration:
                        break

                    kind = event["event"]

                    if kind == "on_chat_model_stream":
                        sse = handle_chat_model_stream(event)
                        if sse:
                            yield sse

                    elif kind == "on_tool_start":
                        yield format_sse({
                            "type": "tool_start",
                            "tool": event["name"],
                            "input": event.get("data", {}).get("input"),
                        })

                    elif kind == "on_tool_end":
                        yield handle_tool_end(event)

                    elif (
                        kind == "on_chain_start"
                        and event.get("metadata", {}).get("langgraph_node", "")
                    ):
                        node = event["metadata"]["langgraph_node"]
                        if node != "__start__":
                            yield format_sse({"type": "node_start", "node": node})
                else:
                    yield format_sse({"type": "heartbeat"})

            # Final state summary
            state = await asyncio.to_thread(graph.get_state, config)

            final_data = {
                "type": "complete",
                "state": {
                    "current_agent": state.values.get("current_agent", "unknown"),
                    "resources_ready": list(
                        state.values.get("content", {}).keys()
                    ),
                    "resources_count": len(state.values.get("content", {})),
                },
            }

            spec = state.values.get("spec")
            if spec:
                final_data["state"]["spec"] = spec.model_dump()

            messages = state.values.get("messages", [])
            last_message = messages[-1].content if messages else "No response"
            final_data["state"]["response"] = last_message

            yield format_sse(final_data)
            
            # Check if builder needs to be launched
            builder_should_run = False
            
            if spec and spec.is_ready:
                content = state.values.get("content", {})
                if len(content) == 0:
                    builder_should_run = True
                    
            if state.values.get("current_agent") == "builder":
                builder_should_run = True
                
            if builder_should_run and not builder_runner.is_building(session_id):
                build_id = await builder_runner.start_build(session_id, graph, config)
                yield format_sse({
                    "type": "builder_started",
                    "build_id": build_id,
                })

        except NoProviderConfiguredError as e:
            yield format_sse({
                "type": "error",
                "code": "NO_PROVIDER",
                "message": str(e),
            })
        except Exception as e:
            import traceback

            traceback.print_exc()

            err_str = str(e)
            auth_keywords = [
                "authentication",
                "invalid_api_key",
                "incorrect api key",
                "invalid x-api-key",
                "api key not valid",
                "unauthorized",
                "permission_denied",
                "invalid api key",
            ]
            is_auth_error = any(kw in err_str.lower() for kw in auth_keywords)

            if is_auth_error:
                yield format_sse({
                    "type": "error",
                    "code": "INVALID_API_KEY",
                    "message": "Invalid API key. Please check your API key in the model settings.",
                })
            else:
                yield format_sse({"type": "error", "message": err_str})

        yield format_sse_end()

    stream = create_sync_stream(generate_response)
    return Response(stream(), mimetype="text/event-stream")
