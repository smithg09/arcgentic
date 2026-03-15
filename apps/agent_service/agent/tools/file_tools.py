"""
File tools for the Builder agent — state-aware via LangGraph Command pattern.

All mutations return a Command that updates AgentState.content directly,
so changes are persisted across the builder's agent→tools→agent loop.
"""

from __future__ import annotations

import re
import uuid
from typing import Annotated, Optional

from langchain_core.messages import ToolMessage
from langchain_core.tools import tool, InjectedToolCallId
from langgraph.prebuilt import InjectedState
from langgraph.types import Command


@tool
def read(
    filename: str,
    state: Annotated[dict, InjectedState],
) -> str:
    """Read content from a file by filename.

    Args:
        filename: Name of the file to read (e.g. 'article.md', 'flashcards.json')

    Returns:
        The file content as a string, or an error message if not found.
    """
    content_store: dict = state.get("content") or {}
    if filename not in content_store:
        available = ", ".join(content_store.keys()) if content_store else "none"
        return f"Error: File '{filename}' not found. Available files: {available}"
    return content_store[filename]["content"]


@tool
def write(
    filename: str,
    content: str,
    tool_call_id: Annotated[str, InjectedToolCallId],
) -> Command:
    """Write/create a file in the content store (persists to agent state).

    Args:
        filename: Name of the file to create (e.g. 'article.md', 'flashcards.json')
        content: The content to write

    Returns:
        Command that updates state.content with the new file.
    """
    return Command(
        update={
            "content": {filename: {"content": content, "path": filename}},
            "messages": [
                ToolMessage(
                    content=f"Successfully wrote {len(content)} chars to '{filename}'",
                    tool_call_id=tool_call_id,
                )
            ],
        }
    )


@tool
def edit(
    filename: str,
    old_content: str,
    new_content: str,
    state: Annotated[dict, InjectedState],
    tool_call_id: Annotated[str, InjectedToolCallId],
) -> Command:
    """Edit a file by replacing exact old_content with new_content.

    Args:
        filename: Name of the file to edit
        old_content: Exact text to find and replace (must match exactly)
        new_content: Text to replace old_content with

    Returns:
        Command that updates state.content with the edited file.
    """
    content_store: dict = state.get("content") or {}
    if filename not in content_store:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=f"Error: File '{filename}' not found.",
                        tool_call_id=tool_call_id,
                    )
                ]
            }
        )

    current = content_store[filename]["content"]
    if old_content not in current:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=f"Error: Could not find old_content in '{filename}'.",
                        tool_call_id=tool_call_id,
                    )
                ]
            }
        )

    updated = current.replace(old_content, new_content, 1)
    return Command(
        update={
            "content": {filename: {"content": updated, "path": filename}},
            "messages": [
                ToolMessage(
                    content=f"Successfully edited '{filename}'",
                    tool_call_id=tool_call_id,
                )
            ],
        }
    )


@tool
def patch(
    filename: str,
    patch_str: str,
    state: Annotated[dict, InjectedState],
    tool_call_id: Annotated[str, InjectedToolCallId],
) -> Command:
    """Apply a unified diff patch to a file's content.

    Args:
        filename: Name of the file to patch
        patch_str: Unified diff format patch string

    Returns:
        Command that updates state.content with the patched file.
    """
    content_store: dict = state.get("content") or {}
    if filename not in content_store:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=f"Error: File '{filename}' not found.",
                        tool_call_id=tool_call_id,
                    )
                ]
            }
        )

    current = content_store[filename]["content"]
    lines = current.split("\n")
    try:
        for line in patch_str.split("\n"):
            if line.startswith("---") or line.startswith("+++") or line.startswith("@@"):
                continue
            elif line.startswith("-"):
                target = line[1:]
                for i, l in enumerate(lines):
                    if l.strip() == target.strip():
                        lines.pop(i)
                        break
            elif line.startswith("+"):
                lines.append(line[1:])

        updated = "\n".join(lines)
        return Command(
            update={
                "content": {filename: {"content": updated, "path": filename}},
                "messages": [
                    ToolMessage(
                        content=f"Successfully patched '{filename}'",
                        tool_call_id=tool_call_id,
                    )
                ],
            }
        )
    except Exception as e:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=f"Error applying patch to '{filename}': {str(e)}",
                        tool_call_id=tool_call_id,
                    )
                ]
            }
        )


@tool
def ls(state: Annotated[dict, InjectedState]) -> str:
    """List all files in the content store.

    Returns:
        A listing of all files with their content sizes.
    """
    content_store: dict = state.get("content") or {}
    if not content_store:
        return "No files in content store."

    lines = []
    for fname, data in sorted(content_store.items()):
        size = len(data["content"])
        lines.append(f"  {fname:<30} {size:>8} chars")

    return f"Files ({len(content_store)}):\n" + "\n".join(lines)


@tool
def grep(
    pattern: str,
    state: Annotated[dict, InjectedState],
    filename: Optional[str] = None,
) -> str:
    """Search for a regex pattern across content files.

    Args:
        pattern: Regex pattern to search for
        filename: Optional specific file to search in. If None, searches all files.

    Returns:
        Matching lines with file and line numbers.
    """
    content_store: dict = state.get("content") or {}

    if filename and filename not in content_store:
        return f"Error: File '{filename}' not found."

    files_to_search = (
        {filename: content_store[filename]}
        if filename and filename in content_store
        else content_store
    )

    try:
        compiled = re.compile(pattern, re.IGNORECASE)
    except re.error as e:
        return f"Error: Invalid regex pattern: {str(e)}"

    results = []
    for fname, data in files_to_search.items():
        for line_num, line in enumerate(data["content"].split("\n"), 1):
            if compiled.search(line):
                results.append(f"  {fname}:{line_num}: {line.strip()}")

    if not results:
        return f"No matches found for pattern '{pattern}'"

    return f"Matches ({len(results)}):\n" + "\n".join(results[:50])


# Flat list — no factory function needed anymore
FILE_TOOLS = [read, write, edit, patch, ls, grep]


def get_file_tools(*args, **kwargs):
    """Backwards-compatible shim. Returns the module-level FILE_TOOLS list."""
    return FILE_TOOLS
