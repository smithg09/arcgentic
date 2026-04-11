"""
State and response serialisation helpers.

Used by session and resource endpoints to convert LangGraph state
objects into JSON-safe dicts.
"""

from __future__ import annotations


def serialize_messages(messages: list) -> list[dict]:
    """Convert LangChain message objects into JSON-serialisable dicts."""
    result = []
    for msg in messages:
        msg_type = msg.__class__.__name__

        if "HumanMessage" in msg_type:
            role = "human"
        elif "SystemMessage" in msg_type:
            role = "system"
        elif "ToolMessage" in msg_type:
            role = "tool"
        else:
            role = "assistant"

        msg_dict = {
            **msg.dict(),
            "role": role,
            "content": msg.content,
        }
        result.append(msg_dict)

    return result


def serialize_resources(content: dict) -> dict:
    """Convert the raw content store into a JSON-safe resource dict."""
    resources = {}
    for key, val in content.items():
        resources[key] = {
            "path": val.get("path", key),
            "content": val.get("content", ""),
            "size": len(val.get("content", "")),
        }
    return resources
