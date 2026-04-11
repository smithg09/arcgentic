"""
Architect sub-graph — conversational requirements gathering with update_spec tool.

Architecture:
    architect_agent_node ──► architect_tool_node ──► architect_agent_node
                         ↘ (no tool calls — done, is_ready set)
                              END (outer graph routes to builder if is_ready=True)

The architect LLM speaks in plain text (shown to user) and calls update_spec()
to persist gathered info. When is_ready=True is set via the tool, the agent
asks no more questions and the sub-graph exits gracefully.
"""

from __future__ import annotations

import os
from typing import Any, Literal

from langchain_core.messages import SystemMessage
from langchain_core.runnables.config import RunnableConfig
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from agent.state import AgentState, LearningSpec
from agent.prompts.architect import ARCHITECT_SYSTEM_PROMPT, format_source_materials
from agent.tools.spec_tools import SPEC_TOOLS
from agent.model_provider import get_chat_model, ModelConfig


# ─────────────────────────────────────────────────────────────────────────────
# Architect agent node
# ─────────────────────────────────────────────────────────────────────────────

async def architect_agent_node(state: AgentState, config: RunnableConfig) -> dict[str, Any]:
    """
    Architect LLM node — asks questions, calls update_spec tool to persist info.

    Reads the current spec from state (including any tool-updated values from
    prior iterations) and decides the next question or handoff.
    """
    model_cfg = state.get("model_config")
    llm = get_chat_model(
        ModelConfig(**model_cfg) if model_cfg else None,
        defaults={"temperature": 0.7, "top_p": 1.0, "streaming": True},
    )

    spec: LearningSpec = state.get("spec") or LearningSpec()
    messages = state.get("messages", [])

    # Bind the update_spec tool
    llm_with_tools = llm.bind_tools(SPEC_TOOLS)

    source_materials_text = format_source_materials(spec.sources)
    system_prompt = ARCHITECT_SYSTEM_PROMPT.format(
        current_spec=spec.model_dump_json(indent=2),
        source_materials=source_materials_text,
    )

    llm_messages = [SystemMessage(content=system_prompt)] + messages
    response = await llm_with_tools.ainvoke(llm_messages, config=config)

    return {
        "messages": [response],
        "current_agent": "architect",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Conditional edge
# ─────────────────────────────────────────────────────────────────────────────

def should_architect_continue(state: AgentState) -> Literal["architect_tools", "__end__"]:
    """
    Keep looping if the agent called update_spec (or any tool), else exit.
    When the agent is done (is_ready set, no more tool calls) → END.
    """
    messages = state.get("messages", [])
    if not messages:
        return "__end__"
    last = messages[-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "architect_tools"
    return "__end__"


# ─────────────────────────────────────────────────────────────────────────────
# Sub-graph factory
# ─────────────────────────────────────────────────────────────────────────────

def create_architect_graph():
    """
    Build and compile the architect sub-graph.

    Added as a direct node in the outer graph. On each user turn:
      1. architect_agent asks a question and/or calls update_spec
      2. architect_tools executes update_spec → state.spec is updated
      3. architect_agent sees updated spec on next iteration
      4. When is_ready=True and no more tool calls → exits sub-graph
      5. Outer graph's route_architect sees is_ready=True → routes to builder

    Returns:
        A compiled LangGraph sub-graph.
    """
    tool_node = ToolNode(SPEC_TOOLS)

    graph = StateGraph(AgentState)
    graph.add_node("architect_agent", architect_agent_node)
    graph.add_node("architect_tools", tool_node)

    graph.set_entry_point("architect_agent")
    graph.add_conditional_edges("architect_agent", should_architect_continue)
    graph.add_edge("architect_tools", "architect_agent")

    return graph.compile()
