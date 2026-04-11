"""
Shared state definitions for the multi-agent learning resource generator.

All generated content lives in `content` dict (no filesystem writes).
Sources are stored individually so the FE can display each PDF/link separately.
"""

from __future__ import annotations

from typing import Annotated, Optional, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field


class Source(BaseModel):
    """An individual source (PDF or link) provided by the user."""

    type: str  # "pdf" | "link"
    name: str  # filename or page title
    url: Optional[str] = None  # original URL (None for PDFs)
    content: str  # extracted text


class LearningSpec(BaseModel):
    """Structured spec built by the Architect agent."""

    topic: str = ""
    experience_level: str = ""  # beginner / intermediate / advanced
    focus_areas: list[str] = Field(default_factory=list)
    learning_goals: list[str] = Field(default_factory=list)
    preferred_depth: str = "moderate"  # shallow / moderate / deep
    sources: list[Source] = Field(default_factory=list)  # individual PDFs/links
    source_summary: str = ""  # LLM-generated summary of all sources (by Architect)
    is_ready: bool = False


class ContentFile(TypedDict):
    """A single generated content file stored in state."""

    content: str  # the actual content data
    path: str  # logical filename, e.g. "podcast.json"


class AgentTask(BaseModel):
    """A single task in the agent execution queue."""

    agent: str  # "builder" | "learning"
    user_request: str  # extracted sub-request for this specific agent


# ─── State reducers ──────────────────────────────────────────────────────────

def merge_content(left: dict, right: dict) -> dict:
    """Merge two content dicts — incoming keys overwrite, existing keys kept."""
    return {**left, **right}


def merge_todos(left: list, right: list) -> list:
    """
    Merge todo lists by task id.
    Incoming items with existing ids overwrite; new ids are appended.
    """
    merged = {item["id"]: item for item in left}
    for item in right:
        merged[item["id"]] = item
    return list(merged.values())


def merge_spec(left: LearningSpec | None, right: LearningSpec | None | dict) -> LearningSpec:
    """Merge LearningSpec objects. Retains existing values and appends new sources/lists."""
    if not left:
        return right if isinstance(right, LearningSpec) else LearningSpec(**(right or {}))
    if not right:
        return left

    # Convert dict to LearningSpec if necessary
    if isinstance(right, dict):
        right = LearningSpec(**right)

    merged = left.model_copy()
    
    # Overwrite non-empty strings/booleans
    if right.topic: merged.topic = right.topic
    if right.experience_level: merged.experience_level = right.experience_level
    if right.preferred_depth and right.preferred_depth != "moderate":
        merged.preferred_depth = right.preferred_depth
    if right.source_summary: merged.source_summary = right.source_summary
    if right.is_ready: merged.is_ready = right.is_ready
    
    # Append lists, avoiding exact duplicates
    if right.focus_areas:
        merged.focus_areas = left.focus_areas + [x for x in right.focus_areas if x not in left.focus_areas]
    if right.learning_goals:
        merged.learning_goals = left.learning_goals + [x for x in right.learning_goals if x not in left.learning_goals]
    if right.sources:
        existing = {(s.name, s.url) for s in left.sources}
        for source in right.sources:
            if (source.name, source.url) not in existing:
                merged.sources.append(source)
                
    return merged


# ─── Agent state ─────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    """The shared state passed through all agent nodes in the graph."""

    messages: Annotated[list[BaseMessage], add_messages]
    spec: Annotated[LearningSpec, merge_spec]
    current_agent: str
    content: Annotated[dict[str, ContentFile], merge_content]
    session_id: str
    todos: Annotated[list[dict], merge_todos]
    agent_queue: list[AgentTask]  # ordered queue of agents to execute
    current_user_request: str  # extracted user prompt for the current agent task
    model_config: dict | None  # ModelConfig dict from FE, flows through all nodes
