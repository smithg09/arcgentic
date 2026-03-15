from __future__ import annotations

from langgraph.graph import StateGraph, END

from agent.state import AgentState
from agent.agents.supervisor import supervisor_node
from agent.agents.learning import create_learning_agent
from agent.agents.architect_graph import create_architect_graph
from agent.agents.builder_graph import create_builder_graph


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


def create_graph(checkpointer=None):
    graph = StateGraph(AgentState)

    architect_subgraph = create_architect_graph()
    graph.add_node("architect", architect_subgraph)

    builder_subgraph = create_builder_graph()
    graph.add_node("builder", builder_subgraph)

    graph.add_conditional_edges("architect", route_architect)

    graph.add_edge("builder", END)

    graph.set_entry_point("architect")

    return graph.compile(checkpointer=checkpointer)


def route_supervisor(state: AgentState) -> str:
    """
    Conditional edge leaving the supervisor node.

    Supervisor writes the selected downstream agent in `current_agent`.
    """
    current_agent = state.get("current_agent")
    if current_agent in {"builder", "learning"}:
        return current_agent
    return "learning"


# @deprecated
def create_supervisor_graph(checkpointer=None):
    graph = StateGraph(AgentState)

    graph.add_node("supervisor", supervisor_node)

    builder_subgraph = create_builder_graph()
    graph.add_node("builder", builder_subgraph)

    learning_subgraph = create_learning_agent()
    graph.add_node("learning", learning_subgraph)

    graph.add_conditional_edges("supervisor", route_supervisor)

    graph.add_edge("builder", END)
    graph.add_edge("learning", END)

    graph.set_entry_point("supervisor")

    return graph.compile(checkpointer=checkpointer)


graph = create_graph()
supervisor_graph = create_supervisor_graph()
learning_graph = create_learning_agent()