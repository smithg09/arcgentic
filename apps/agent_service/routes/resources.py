"""Resource retrieval endpoints."""

from __future__ import annotations

import asyncio

from flask import Blueprint, jsonify

from config import get_graph
from utils.serializers import serialize_resources

resources_bp = Blueprint("resources", __name__)


@resources_bp.route("/api/sessions/<session_id>/resources", methods=["GET"])
async def get_resources(session_id: str):
    """Return all generated resources for a session."""
    graph = await get_graph()
    config = {"configurable": {"thread_id": session_id}}

    try:
        state = await asyncio.to_thread(graph.get_state, config)
        resources = serialize_resources(state.values.get("content", {}))

        spec = state.values.get("spec")
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


@resources_bp.route(
    "/api/sessions/<session_id>/resources/<resource_type>", methods=["GET"]
)
async def get_resource(session_id: str, resource_type: str):
    """Return a single resource by type."""
    graph = await get_graph()
    config = {"configurable": {"thread_id": session_id}}

    try:
        state = await asyncio.to_thread(graph.get_state, config)
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
