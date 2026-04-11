"""Session state and source-upload endpoints."""

from __future__ import annotations

import asyncio

from flask import Blueprint, jsonify, request

from config import get_graph
from agent.state import LearningSpec
from agent.parsers import parse_user_input
from middleware.request_parser import parse_sources_request
from utils.serializers import serialize_messages, serialize_resources

sessions_bp = Blueprint("sessions", __name__)


@sessions_bp.route("/api/sessions/<session_id>", methods=["GET"])
async def get_session(session_id: str):
    """Return the full state of a session."""
    graph = await get_graph()
    config = {"configurable": {"thread_id": session_id}}

    try:
        state = await asyncio.to_thread(graph.get_state, config)

        if not state.values:
            return jsonify({
                "session_id": session_id,
                "exists": False,
                "message": "Session not found or has no state yet.",
            }), 404

        values = state.values
        messages = serialize_messages(values.get("messages", []))
        resources = serialize_resources(values.get("content", {}))

        spec = values.get("spec")
        spec_data = spec.model_dump() if spec else None

        sources = []
        if spec_data and spec_data.get("sources"):
            sources = spec_data["sources"]

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


@sessions_bp.route("/api/sessions/<session_id>/sources", methods=["POST"])
async def add_sources(session_id: str):
    """Add new source materials to an existing session."""
    graph = await get_graph()

    parsed = parse_sources_request(request)

    if not parsed.urls and not parsed.files:
        return jsonify({"error": "No sources provided"}), 400

    new_sources = parse_user_input(
        files=parsed.files if parsed.files else None,
        urls=parsed.urls if parsed.urls else None,
    )
    if not new_sources:
        return jsonify({"error": "Failed to parse any sources"}), 400

    config = {"configurable": {"thread_id": session_id}}

    try:
        state = await asyncio.to_thread(graph.get_state, config)
        spec = state.values.get("spec")

        if not spec:
            spec = LearningSpec(sources=new_sources)
        else:
            spec.sources.extend(new_sources)

        await asyncio.to_thread(graph.update_state, config, {"spec": spec})

        serialized = [s.model_dump() for s in spec.sources]
        return jsonify({
            "status": "success",
            "added": len(new_sources),
            "sources": serialized,
        })
    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
