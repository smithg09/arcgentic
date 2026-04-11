"""
Batch task management tools for the Builder and Learning agents.

Supports creating and updating multiple todos in a single tool call,
reducing LLM round-trips and token overhead.
"""

from __future__ import annotations

import uuid
from typing import Annotated

from langchain_core.messages import ToolMessage
from langchain_core.tools import tool, InjectedToolCallId
from langgraph.prebuilt import InjectedState
from langgraph.types import Command


@tool
def write_todos(
    items: list[dict],
    state: Annotated[dict, InjectedState],
    tool_call_id: Annotated[str, InjectedToolCallId],
) -> Command:
    """Create one or more todo items for tracking progress.

    Args:
        items: List of dicts, each with keys:
            - task (str): Description of the task
            - category (str): Category grouping (e.g. 'explanation', 'flashcards')

    Returns:
        Command that appends all new todos to state.todos.
    """
    if not items:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content="Error: items list is empty.",
                        tool_call_id=tool_call_id,
                        name="write_todos",
                    )
                ]
            }
        )

    current_todos: list = list(state.get("todos") or [])
    new_todos = []
    summaries = []

    for item in items:
        task = item.get("task", "")
        category = item.get("category", "general")
        task_id = str(uuid.uuid4())[:8]

        new_todos.append({
            "id": task_id,
            "task": task,
            "category": category,
            "status": "pending",
        })
        summaries.append(f"[{task_id}] {task} ({category})")

    return Command(
        update={
            "todos": current_todos + new_todos,
            "messages": [
                ToolMessage(
                    content=f"Created {len(new_todos)} todo(s):\n" + "\n".join(summaries),
                    tool_call_id=tool_call_id,
                    name="write_todos",
                )
            ],
        }
    )


@tool
def update_todos(
    items: list[dict],
    state: Annotated[dict, InjectedState],
    tool_call_id: Annotated[str, InjectedToolCallId],
) -> Command:
    """Update the status of one or more todo items.

    Args:
        items: List of dicts, each with keys:
            - task_id (str): ID of the todo to update
            - status (str): New status — 'pending', 'in_progress', or 'done'

    Returns:
        Command that updates the matching todos in state.todos.
    """
    if not items:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content="Error: items list is empty.",
                        tool_call_id=tool_call_id,
                        name="update_todos",
                    )
                ]
            }
        )

    valid_statuses = {"pending", "in_progress", "done"}
    todos: list = list(state.get("todos") or [])
    todo_map = {t["id"]: t for t in todos}

    summaries = []
    errors = []

    for item in items:
        task_id = item.get("task_id", "")
        status = item.get("status", "")

        if status not in valid_statuses:
            errors.append(f"Invalid status '{status}' for [{task_id}]")
            continue

        if task_id not in todo_map:
            errors.append(f"Todo '{task_id}' not found")
            continue

        todo_map[task_id] = {**todo_map[task_id], "status": status}
        summaries.append(f"[{task_id}] → {status}")

    updated_todos = list(todo_map.values())
    msg_parts = []

    if summaries:
        msg_parts.append(f"Updated {len(summaries)} todo(s):\n" + "\n".join(summaries))
    if errors:
        msg_parts.append(f"Errors:\n" + "\n".join(errors))

    return Command(
        update={
            "todos": updated_todos,
            "messages": [
                ToolMessage(
                    content="\n\n".join(msg_parts) or "No changes made.",
                    tool_call_id=tool_call_id,
                    name="update_todos",
                )
            ],
        }
    )


TASK_TOOLS = [write_todos, update_todos]
