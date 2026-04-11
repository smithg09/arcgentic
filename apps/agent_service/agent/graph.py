from __future__ import annotations

from langgraph.graph import StateGraph, END

from agent.state import AgentState
from agent.agents.supervisor import supervisor_node
from agent.agents.learning import create_learning_graph
from agent.agents.architect_graph import create_architect_graph
from agent.agents.builder_graph import create_builder_graph


def route_entry(state: AgentState) -> str:
    """
    Entry router — decides whether the user needs onboarding (architect)
    or can go straight to the supervisor for routing.

    Goes to supervisor if:
      - spec.is_ready is True, OR
      - state["content"] already has at least one entry (dict value)

    Otherwise goes to architect for requirements gathering.
    """
    spec = state.get("spec")
    content = state.get("content")

    # If the spec is already finalised, skip architect
    if spec and spec.is_ready:
        return "supervisor"

    # If content dict already has at least one value, skip architect
    if content and len(content) > 0:
        return "supervisor"

    # First-time user — gather requirements
    return "architect"


def route_architect(state: AgentState) -> str:
    """
    Conditional edge leaving the architect sub-graph.

    If the architect set spec.is_ready = True → route to builder.
    Otherwise → END (wait for next user message in the same thread).
    """
    spec = state.get("spec")
    if spec and spec.is_ready:
        return "builder"
    return "__end__"


def queue_processor(state: AgentState) -> dict:
    """
    Pops the first task from agent_queue, sets current_agent and
    current_user_request so the downstream sub-graph knows what to do.

    When the queue is empty, sets current_agent to "__end__" so
    route_queue sends the graph to END — no separate route_after_agent needed.
    """
    queue = list(state.get("agent_queue") or [])

    if not queue:
        return {
            "current_agent": "__end__",
            "current_user_request": "",
            "agent_queue": [],
        }

    # Pop the first task
    current_task = queue[0]
    remaining = queue[1:]

    return {
        "current_agent": current_task.agent,
        "current_user_request": current_task.user_request,
        "agent_queue": remaining,
    }


def route_queue(state: AgentState) -> str:
    """
    Routes from queue_processor to the correct agent sub-graph,
    or to END if the queue is exhausted.
    """
    current_agent = state.get("current_agent")
    if current_agent in {"builder", "learning"}:
        return current_agent
    return "__end__"


def create_supervisor_graph(checkpointer=None):
    """Build and compile the top-level supervisor graph."""
    graph = StateGraph(AgentState)

    # Nodes
    graph.add_node("supervisor", supervisor_node)
    graph.add_node("queue_processor", queue_processor)
    graph.add_node("architect", create_architect_graph())
    graph.add_node("builder", create_builder_graph())
    graph.add_node("learning", create_learning_graph())

    # Entry
    graph.set_conditional_entry_point(route_entry)

    # Edges
    graph.add_edge("supervisor", "queue_processor")
    graph.add_conditional_edges("queue_processor", route_queue)
    graph.add_conditional_edges("architect", route_architect)
    graph.add_edge("builder", "queue_processor")
    graph.add_edge("learning", "queue_processor")

    return graph.compile(checkpointer=checkpointer)
