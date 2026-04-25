"""Background runner for the Builder agent."""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
import threading
from typing import TypedDict, Any

from config import DATABASE_URL
from agent.state import AgentState
from agent.db import get_checkpointer
from agent.agents.builder_graph import create_builder_graph

logger = logging.getLogger("arcgentic.builder")

class BuildState:
    """State of a background build execution."""
    status: str  # "idle" | "running" | "completed" | "error"
    events: list[dict]
    resources_ready: list[str]
    error: str | None
    started_at: datetime | None
    completed_at: datetime | None
    build_id: str

    def __init__(self, build_id: str):
        self.status = "idle"
        self.events = []
        self.resources_ready = []
        self.error = None
        self.started_at = None
        self.completed_at = None
        self.build_id = build_id

    def to_dict(self) -> dict:
        return {
            "status": self.status,
            "resources_ready": self.resources_ready,
            "error": self.error,
            "build_id": self.build_id,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }

class BuilderRunner:
    """Manages background builder execution."""

    def __init__(self):
        self._builds: dict[str, BuildState] = {}  # session_id -> BuildState

    def get_status(self, session_id: str) -> dict:
        """Get the current build status for a session."""
        build = self._builds.get(session_id)
        if not build:
            return {
                "status": "idle",
                "resources_ready": [],
                "error": None,
                "build_id": None
            }
        return build.to_dict()

    def get_events(self, session_id: str, after: int = 0) -> list[dict]:
        """Get events for a session after the given index."""
        build = self._builds.get(session_id)
        if not build:
            return []
        return build.events[after:]

    def is_building(self, session_id: str) -> bool:
        """Check if a build is currently running."""
        build = self._builds.get(session_id)
        return build is not None and build.status == "running"

    async def start_build(self, session_id: str, graph, config: dict) -> str:
        """Start a background build task."""
        build_id = str(uuid.uuid4())
        build = BuildState(build_id)
        build.status = "running"
        build.started_at = datetime.now(timezone.utc)
        self._builds[session_id] = build

        # Get current state from main graph to pass to builder
        state_info = await asyncio.to_thread(graph.get_state, config)
        state: AgentState = state_info.values

        # Clear builder_pending flag in the main graph checkpointer
        # so we don't trigger again on next interaction
        if "builder_pending" in state:
            state_update = {"builder_pending": False}
            await asyncio.to_thread(graph.update_state, config, state_update)

        # Start the task in a dedicated thread with its own event loop
        # This prevents the task from being cancelled when the Flask request loop closes
        def run_in_thread():
            asyncio.run(self._run_builder(session_id, state, config, build))
            
        threading.Thread(target=run_in_thread, daemon=True).start()
        return build_id

    async def _run_builder(self, session_id: str, state: AgentState, config: dict, build: BuildState):
        """Execute the builder graph and capture events."""
        try:
            # Initialize a fresh checkpointer bound to this thread's event loop
            checkpointer = get_checkpointer(DATABASE_URL)
            builder_graph = create_builder_graph(checkpointer=checkpointer)
            
            # Use a slightly modified config for the builder run to ensure it uses the same checkpointer logic
            # but we run it as a standalone graph invocation
            builder_config = {**config}
            builder_config["recursion_limit"] = 200
            
            # If current_agent is set to builder from supervisor queue, we need to process it
            # The builder node expects state.current_agent == "builder"
            if state.get("current_agent") != "builder":
                # Ensure the builder agent is the entry point state
                state["current_agent"] = "builder"

            logger.info(f"Starting background builder for session {session_id}")

            async for event in builder_graph.astream_events(state, config=builder_config, version="v2"):
                kind = event["event"]

                logger.debug(f"Builder event for session {session_id}: {kind}")
                
                # Format event for SSE
                formatted_event = None
                
                if kind == "on_chat_model_stream":
                    chunk = event["data"]["chunk"]
                    if getattr(chunk, "content", None):
                        content = chunk.content
                        if isinstance(content, list) and len(content) > 0 and isinstance(content[0], dict):
                            text = content[0].get("text", "")
                            if text:
                                formatted_event = {"type": "token", "content": text}
                        elif isinstance(content, str):
                            formatted_event = {"type": "token", "content": content}
                            
                elif kind == "on_tool_start":
                    formatted_event = {
                        "type": "tool_start",
                        "tool": event["name"],
                        "input": event.get("data", {}).get("input"),
                    }
                    
                elif kind == "on_tool_end":
                    output = event.get("data", {}).get("output")
                    output_str = ""
                    
                    if type(output).__name__ == "Command":
                        update_data = getattr(output, "update", {})
                        if (
                            isinstance(update_data, dict)
                            and "content" in update_data
                            and isinstance(update_data["content"], dict)
                        ):
                            files = list(update_data["content"].keys())
                            if files:
                                output_str = f"Updated files: {', '.join(files)}"
                                # Update resources ready
                                for f in files:
                                    if f not in build.resources_ready:
                                        build.resources_ready.append(f)
                                        # Emit resource ready event
                                        build.events.append({
                                            "type": "resource_ready",
                                            "key": f
                                        })

                        if not output_str:
                            try:
                                output_str = json.dumps(update_data)
                            except Exception:
                                output_str = str(update_data)
                    else:
                        output_str = str(output.content) if hasattr(output, "content") else str(output)
                        
                    formatted_event = {
                        "type": "tool_end",
                        "tool": event["name"],
                        "output": output_str,
                        "input": event.get("data", {}).get("input")
                    }
                    
                elif kind == "on_chain_start" and event.get("metadata", {}).get("langgraph_node", ""):
                    node = event["metadata"]["langgraph_node"]
                    if node != "__start__":
                        formatted_event = {"type": "node_start", "node": node}
                
                if formatted_event:
                    build.events.append(formatted_event)

            # Builder completed successfully
            build.status = "completed"
            build.completed_at = datetime.now(timezone.utc)
            build.events.append({"type": "builder_complete"})
            logger.info(f"Background builder completed for session {session_id}")

        except Exception as e:
            import traceback
            traceback.print_exc()
            build.status = "error"
            build.error = str(e)
            build.completed_at = datetime.now(timezone.utc)
            build.events.append({"type": "builder_error", "message": str(e)})
            logger.error(f"Background builder failed for session {session_id}: {e}")

# Singleton instance
builder_runner = BuilderRunner()
