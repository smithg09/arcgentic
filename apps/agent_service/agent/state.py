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

# ─── Agent state ─────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    """The shared state passed through all agent nodes in the graph."""

    messages: Annotated[list[BaseMessage], add_messages]
    spec: LearningSpec
    current_agent: str
    content: Annotated[dict[str, ContentFile], merge_content]
    session_id: str
    todos: Annotated[list[dict], merge_todos]
