"""
Task management tools for the Builder and Learning agents.
State-aware via LangGraph Command pattern — mutations persist to AgentState.
"""

from __future__ import annotations

import uuid
from typing import Annotated

from langchain_core.messages import ToolMessage
from langchain_core.tools import tool, InjectedToolCallId
from langgraph.prebuilt import InjectedState
from langgraph.types import Command


@tool
def write_todo(
    task: str,
    category: str,
    state: Annotated[dict, InjectedState],
    tool_call_id: Annotated[str, InjectedToolCallId],
) -> Command:
    """Add a new todo item for tracking progress.

    Args:
        task: Description of the task
        category: Category grouping (e.g. 'explanation', 'flashcards', 'setup')

    Returns:
        Command that appends the todo to state.todos.
    """
    task_id = str(uuid.uuid4())[:8]
    new_todo = {
        "id": task_id,
        "task": task,
        "category": category,
        "status": "pending",
    }
    current_todos: list = list(state.get("todos") or [])
    return Command(
        update={
            "todos": current_todos + [new_todo],
            "messages": [
                ToolMessage(
                    content=f"Todo created: [{task_id}] {task} (category: {category})",
                    tool_call_id=tool_call_id,
                    name="write_todo",
                )
            ],
        }
    )


@tool
def update_todo(
    task_id: str,
    status: str,
    state: Annotated[dict, InjectedState],
    tool_call_id: Annotated[str, InjectedToolCallId],
) -> Command:
    """Update the status of a todo item.

    Args:
        task_id: ID of the todo to update
        status: New status — 'pending', 'in_progress', or 'done'

    Returns:
        Command that updates the todo in state.todos.
    """
    valid_statuses = {"pending", "in_progress", "done"}
    if status not in valid_statuses:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=f"Error: Invalid status '{status}'. Must be one of: {valid_statuses}",
                        tool_call_id=tool_call_id,
                        name="update_todo",
                    )
                ]
            }
        )

    todos: list = list(state.get("todos") or [])
    updated_todos = []
    found = False
    for todo in todos:
        if todo["id"] == task_id:
            updated_todos.append({**todo, "status": status})
            found = True
        else:
            updated_todos.append(todo)

    if not found:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=f"Error: Todo '{task_id}' not found.",
                        tool_call_id=tool_call_id,
                        name="update_todo",
                    )
                ]
            }
        )

    return Command(
        update={
            "todos": updated_todos,
            "messages": [
                ToolMessage(
                    content=f"Todo [{task_id}] updated to '{status}'",
                    tool_call_id=tool_call_id,
                    name="update_todo",
                )
            ],
        }
    )

# Flat list — no factory function needed anymore
TASK_TOOLS = [write_todo, update_todo]


def get_task_tools(*args, **kwargs):
    """Backwards-compatible shim. Returns the module-level TASK_TOOLS list."""
    return TASK_TOOLS
