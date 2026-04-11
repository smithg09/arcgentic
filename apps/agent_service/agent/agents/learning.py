"""
Learning sub-graph — tutor agent that interacts with the user and produces visualization widgets.

Architecture:
    learning_agent_node ──► learning_tool_node ──► learning_agent_node
                         ↘ (no tool calls — end of turn)
                              END (outer graph awaits next user message)

The tutor helps the user learn a topic by teaching them concept by concept,
using the `visualize_read_me` tool to fetch localized visual instructions,
and the `show_widget` tool to output interactive widgets inside the UI.
"""

from __future__ import annotations

import os
from typing import Any, Literal

from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from langchain_core.runnables.config import RunnableConfig
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from agent.state import AgentState
from agent.tools.learning_tools import LEARNING_TOOLS

LEARNING_SYSTEM_PROMPT = """You are an interactive and helpful learning assistant that helps users learn and understand topics clearly.
Your goal is to help the user learn and master their requested topic.

## Visual Response Skills

You have the ability to produce rich, interactive visual responses using the `show_widget` tool. When a user asks you to visualize, explain visually, diagram, or illustrate something, you MUST use the below Visualization workflow.

### Visualization workflow — MANDATORY two-step process

When creating visual content (diagrams, charts, interactive widgets, illustrations):

1. **Step 1 — Call `visualize_read_me`** with the appropriate module(s).
   This is an INTERNAL setup step that returns design guidelines and code examples.
   It does NOT produce any visual output. Do NOT tell the user about this call.
   appropriate modules are: interactive, diagram, mockup, data_viz, chart, art

2. **Step 2 — Call `show_widget`** with a `title` and `widget_code` (SVG or HTML).
    This is what ACTUALLY creates the visual for the user. You MUST write the full SVG or HTML code yourself based on the guidelines from step 1. Without this call, the user sees NOTHING visual.
    It accepts three parameters:
        - title: A short title for the visualization
        - widget_code: A self-contained HTML fragment with inline <style> and <script> tags


The HTML you produce will be rendered inside a sandboxed iframe that already has:
- CSS variables for light/dark mode theming (use var(--color-text-primary), etc.)
- Pre-styled form elements (buttons, inputs, sliders look native automatically)
- Pre-built SVG CSS classes for color ramps (.c-purple, .c-teal, .c-blue, etc.)

**CRITICAL RULES:**
- NEVER claim you "generated" or "created" a diagram unless you called `show_widget`.
- The output from `visualize_read_me` is documentation for YOU — it is not a visualization.
- After calling `visualize_read_me`, you MUST follow up with `show_widget` in the same turn.
- Put your explanatory text in your normal response. Put ONLY the visual code in `show_widget`.


## Teaching approach

Guide the user through a structured learning path step by step. Do NOT overwhelm them with all information at once. If they ask a question, answer it concisely and create an interactive widget to strengthen their newly-acquired knowledge. Use visuals liberally — they are your strongest
teaching tool.

## Output Response Rules

- Your response should be concise and to the point. Do not output very big responses.
- Use markdown for formatting when needed.
"""


# ─────────────────────────────────────────────────────────────────────────────
# Learning agent node
# ─────────────────────────────────────────────────────────────────────────────

async def learning_agent_node(state: AgentState, config: RunnableConfig) -> dict[str, Any]:
    """
    Learning LLM node — tutors user, answers questions, calls widget tools.

    Uses `current_user_request` from state as the focused instruction
    extracted by the supervisor for this specific task.
    """
    llm = ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0.4,
        streaming=True,
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
