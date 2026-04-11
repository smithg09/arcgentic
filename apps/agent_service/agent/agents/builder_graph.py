"""
Builder sub-graph — an autonomous LangGraph loop for content generation.

Architecture:
    builder_agent_node ──► builder_tools (ToolNode) ──► builder_agent_node
                       ↘ (no tool calls — done)
                            END

Tools use InjectedState to read content and return Command objects to write
back to AgentState, so all file writes persist across the loop iterations.
"""

from __future__ import annotations

import os
from typing import Any, Literal

from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langchain_core.runnables.config import RunnableConfig
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from agent.state import AgentState, LearningSpec
from agent.prompts.builder import BUILDER_SYSTEM_PROMPT
from agent.tools.file_tools import FILE_TOOLS
from agent.tools.task_tools import TASK_TOOLS
from agent.tools.skill_tools import SKILL_TOOLS

# All tools available to the builder
ALL_BUILDER_TOOLS = FILE_TOOLS + TASK_TOOLS + SKILL_TOOLS


# ─────────────────────────────────────────────────────────────────────────────
# Builder agent node
# ─────────────────────────────────────────────────────────────────────────────

async def builder_agent_node(state: AgentState, config: RunnableConfig) -> dict[str, Any]:
    """
    Builder LLM reasoning node.

    Reads current state, binds all tools, and lets the LLM decide the next
    action (list skills, fetch instructions, generate content, write files).
    The LLM loops via tool calls until it declares completion with no tool call.

    Uses `current_user_request` from state as the focused instruction
    extracted by the supervisor for this specific task.
    """
    llm = ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=1.0,
        top_p=1.0,
        streaming=True,
    )

    spec = state.get("spec") or LearningSpec()
    content = state.get("content") or {}
    messages = state.get("messages", [])
    current_user_request = state.get("current_user_request", "")

    llm_with_tools = llm.bind_tools(ALL_BUILDER_TOOLS)

    is_first_build = len(content) == 0

    # Base system prompt
    system_prompt = BUILDER_SYSTEM_PROMPT.format(
        topic=spec.topic,
        experience_level=spec.experience_level,
        focus_areas=", ".join(spec.focus_areas),
        learning_goals=", ".join(spec.learning_goals),
        preferred_depth=spec.preferred_depth,
        source_summary=spec.source_summary or "No source materials provided.",
    )

    autonomy_block = """
## How to Build (Autonomous Mode)

You are fully autonomous. Use your tools to build content:
1. Call `list_skills()` to see available content types.
2. Call `get_skills(["resource_type", ...])` to fetch generation instructions for one or more types at once.
3. Generate each piece of content following those instructions exactly.
4. Call `write("filename", content)` to save each file to state.
5. Repeat as needed for each resource.
6. When ALL planned resources are saved, output a final completion summary — do NOT call any more tools.
"""

    if is_first_build:
        first_build_block = """
## First Build — Required Resources

This is the FIRST build. No content exists yet. You MUST generate ALL FIVE of these:
  1. `explanation.md`    — comprehensive markdown explanation with diagrams, tables, and rich formatting
  2. `podcast.json`      — conversational podcast script
  3. `presentation.json` — slide deck JSON
  4. `flashcards.json`   — spaced-repetition flashcard set
  5. `roadmap.json`  — roadmap with nodes and edges

Recommended workflow (efficient):
  a. get_skills(["explanation.md", "podcast.json", "presentation.json", "flashcards.json", "roadmap.json"])  ← fetch all at once
  b. Generate explanation.md    → write("explanation.md", <content>)
  c. Generate podcast.json      → write("podcast.json", <content>)
  d. Generate presentation.json → write("presentation.json", <content>)
  e. Generate flashcards.json   → write("flashcards.json", <content>)
  f. Generate roadmap.json  → write("roadmap.json", <content>)

After all five are written, output your completion message (no more tool calls).
"""
        system_prompt += first_build_block
    else:
        already_built = ", ".join(content.keys()) or "none"
        system_prompt += (
            autonomy_block
            + f"\n## Already Generated\n{already_built}\n\n"
            "Decide which additional resources to generate, or improve existing ones."
        )

    # Inject the focused current user request if available
    if current_user_request:
        system_prompt += (
            f"\n## Current User Request\n"
            f"Focus on this specific request:\n> {current_user_request}\n"
        )

    llm_messages = [SystemMessage(content=system_prompt)] + messages
    response = await llm_with_tools.ainvoke(llm_messages, config=config)

    return {
        "messages": [response],
        "current_agent": "builder",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Conditional edge
# ─────────────────────────────────────────────────────────────────────────────

def should_continue(state: AgentState) -> Literal["builder_tools", "__end__"]:
    """Continue looping if the agent emitted tool calls, else exit sub-graph."""
    messages = state.get("messages", [])
    if not messages:
        return "__end__"
    last_message = messages[-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "builder_tools"
    return "__end__"


# ─────────────────────────────────────────────────────────────────────────────
# Sub-graph factory
# ─────────────────────────────────────────────────────────────────────────────

def create_builder_graph():
    """
    Build and compile the builder sub-graph.

    ToolNode receives the flat ALL_BUILDER_TOOLS list. When a tool returns
    a Command, ToolNode merges its update into AgentState directly, so
    file writes (content dict) and todo/memory updates all persist correctly.

    Returns:
        A compiled LangGraph sub-graph to be added as a node in the outer graph.
    """
    tool_node = ToolNode(ALL_BUILDER_TOOLS)

    graph = StateGraph(AgentState)
    graph.add_node("builder_agent", builder_agent_node)
    graph.add_node("builder_tools", tool_node)

    graph.set_entry_point("builder_agent")
    graph.add_conditional_edges("builder_agent", should_continue)
    graph.add_edge("builder_tools", "builder_agent")

    return graph.compile()
