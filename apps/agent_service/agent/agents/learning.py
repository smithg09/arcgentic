"""
Learning sub-graph — tutor agent that interacts with the user and produces
visualisation widgets.

Architecture:
    learning_agent_node ──► learning_tool_node ──► learning_agent_node
                         ↘ (no tool calls — end of turn)
                              END (outer graph awaits next user message)
"""

from __future__ import annotations

from typing import Any, Literal

from langchain_core.messages import SystemMessage
from langchain_core.runnables.config import RunnableConfig
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from agent.state import AgentState
from agent.tools.learning_tools import LEARNING_TOOLS
from agent.model_provider import get_chat_model, ModelConfig
from agent.prompts.learning import LEARNING_SYSTEM_PROMPT


# ─────────────────────────────────────────────────────────────────────────────
# Learning agent node
# ─────────────────────────────────────────────────────────────────────────────

async def learning_agent_node(state: AgentState, config: RunnableConfig) -> dict[str, Any]:
    """
    Learning LLM node — tutors user, answers questions, calls widget tools.

    Uses `current_user_request` from state as the focused instruction
    extracted by the supervisor for this specific task.
    """
    model_cfg = state.get("model_config")
    llm = get_chat_model(
        ModelConfig(**model_cfg) if model_cfg else None,
        defaults={"temperature": 0.4, "streaming": True},
    )

    messages = state.get("messages", [])
    current_user_request = state.get("current_user_request", "")

    # Bind tools
    llm_with_tools = llm.bind_tools(LEARNING_TOOLS)

    # Inject the focused current user request if available
    system_prompt = LEARNING_SYSTEM_PROMPT
    if current_user_request:
        system_prompt += (
            f"\n## Current User Request\n"
            f"Focus on this specific request:\n> {current_user_request}\n"
        )

    llm_messages = [SystemMessage(content=system_prompt)] + messages
    response = await llm_with_tools.ainvoke(llm_messages, config=config)

    return {
        "messages": [response],
        "current_agent": "learning",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Conditional edge
# ─────────────────────────────────────────────────────────────────────────────

def should_learning_continue(state: AgentState) -> Literal["learning_tools", "__end__"]:
    """
    Keep looping if the agent called the show_widget or visualize_read_me tools.
    Otherwise -> End.
    """
    messages = state.get("messages", [])
    if not messages:
        return "__end__"
    last = messages[-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "learning_tools"
    return "__end__"


# ─────────────────────────────────────────────────────────────────────────────
# Sub-graph factory
# ─────────────────────────────────────────────────────────────────────────────

def create_learning_graph():
    """
    Build and compile the learning sub-graph.
    """
    tool_node = ToolNode(LEARNING_TOOLS)

    graph = StateGraph(AgentState)
    graph.add_node("learning_agent", learning_agent_node)
    graph.add_node("learning_tools", tool_node)

    graph.set_entry_point("learning_agent")
    graph.add_conditional_edges("learning_agent", should_learning_continue)
    graph.add_edge("learning_tools", "learning_agent")

    return graph.compile()
