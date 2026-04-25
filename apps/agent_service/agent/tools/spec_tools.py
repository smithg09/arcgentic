"""
Spec tool for the Architect agent — updates LearningSpec in state via Command.

The architect LLM calls this when it wants to persist gathered requirements.
Using Command ensures the spec is updated in AgentState (not just a local mutation).
"""

from __future__ import annotations

from typing import Annotated, Optional

from langchain_core.messages import ToolMessage
from langchain_core.tools import tool, InjectedToolCallId
from langgraph.prebuilt import InjectedState
from langgraph.types import Command

from agent.state import LearningSpec


@tool
def update_spec(
    state: Annotated[dict, InjectedState],
    tool_call_id: Annotated[str, InjectedToolCallId],
    topic: Optional[str] = None,
    experience_level: Optional[str] = None,
    focus_areas: Optional[list[str]] = None,
    learning_goals: Optional[list[str]] = None,
    preferred_depth: Optional[str] = None,
    source_summary: Optional[str] = None,
    is_ready: bool = False,
) -> Command:
    """Update the learning specification with requirements gathered from the user.

    Call this whenever you extract useful information from user responses.
    Call with is_ready=True when you have enough to start building.

    Args:
        topic: What the user wants to learn
        experience_level: 'beginner', 'intermediate', or 'advanced'
        focus_areas: Specific areas to focus on (list of strings)
        learning_goals: What the user wants to achieve (list of strings)
        preferred_depth: 'shallow', 'moderate', or 'deep'
        source_summary: Summary of uploaded source materials in few sentences for builder to understand the context and content of the source materials  
        is_ready: Set True when spec is complete — triggers handoff to builder

    Returns:
        Command that updates state.spec with the new values.
    """
    # Read existing spec from live state
    existing: LearningSpec = state.get("spec") or LearningSpec()

    # Build updated spec — only overwrite fields that were provided
    updates: dict = {}
    if topic is not None:
        updates["topic"] = topic
    if experience_level is not None:
        updates["experience_level"] = experience_level
    if focus_areas is not None:
        updates["focus_areas"] = focus_areas
    if learning_goals is not None:
        updates["learning_goals"] = learning_goals
    if preferred_depth is not None:
        updates["preferred_depth"] = preferred_depth
    if source_summary is not None:
        updates["source_summary"] = source_summary
    if is_ready:
        updates["is_ready"] = True

    updated_spec = existing.model_copy(update=updates)

    fields_updated = list(updates.keys()) or ["(none)"]
    confirmation = f"Spec updated: {', '.join(fields_updated)}."
    if is_ready:
        confirmation += " Spec is READY — handing off to builder."

    return Command(
        update={
            "spec": updated_spec,
            "messages": [
                ToolMessage(
                    content=confirmation,
                    tool_call_id=tool_call_id,
                    name="update_spec",
                )
            ],
        }
    )


SPEC_TOOLS = [update_spec]
