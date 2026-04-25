"""Builder progress and event stream endpoints."""

from __future__ import annotations

import asyncio
from flask import Blueprint, jsonify, request, Response

from agent.builder_runner import builder_runner
from utils.sse import create_sync_stream, format_sse, format_sse_end

build_bp = Blueprint("build", __name__)


@build_bp.route("/api/sessions/<session_id>/build-status", methods=["GET"])
async def build_status(session_id: str):
    """Get the current background build status for a session."""
    status = builder_runner.get_status(session_id)
    return jsonify(status)


@build_bp.route("/api/sessions/<session_id>/build-stream", methods=["GET"])
async def build_stream(session_id: str):
    """Stream builder events in real-time."""
    
    after_param = request.args.get("after", "0")
    try:
        after = int(after_param)
    except ValueError:
        after = 0
        
    async def generate_events():
        # Yield missed events first
        missed_events = builder_runner.get_events(session_id, after)
        for event in missed_events:
            yield format_sse(event)
            
        # If the build is completed, we just yield the missed events and close
        status = builder_runner.get_status(session_id)
        if status["status"] in ("completed", "error", "idle"):
            yield format_sse_end()
            return
            
        # Poll for new events (simple implementation)
        # A more advanced one would use asyncio.Event or Queue per client
        last_idx = after + len(missed_events)
        
        while True:
            # Check if build finished
            status = builder_runner.get_status(session_id)
            
            # Get any new events
            new_events = builder_runner.get_events(session_id, last_idx)
            for event in new_events:
                yield format_sse(event)
                
            last_idx += len(new_events)
            
            if status["status"] in ("completed", "error", "idle"):
                break
                
            yield format_sse({"type": "heartbeat"})
            await asyncio.sleep(1.0)
            
        yield format_sse_end()

    stream = create_sync_stream(generate_events)
    return Response(stream(), mimetype="text/event-stream")
