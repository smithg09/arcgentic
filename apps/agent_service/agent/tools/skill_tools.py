"""
Skill tools for the Builder agent — read-only, state-aware via InjectedState.

These tools expose resource-type generation prompts on demand so the builder
can decide what to generate without hardcoded loops.
"""

from __future__ import annotations

from typing import Annotated

from langchain_core.messages import ToolMessage
from langchain_core.tools import tool, InjectedToolCallId
from langgraph.prebuilt import InjectedState
from langgraph.types import Command

from agent.prompts.builder import RESOURCE_PROMPTS, get_resource_prompt


SKILL_DESCRIPTIONS: dict[str, str] = {
    "article.md": "Long-form markdown article with sections, code examples, and key takeaways",
    "podcast.json": "Conversational podcast script with multiple speakers, intro/outro, and timed segments",
    "presentation.json": "Slide deck JSON with title, bullets, speaker notes, and visual suggestions",
    "video_script.json": "Video narration script with scenes, visuals descriptions, and timing",
    "flashcards.json": "Spaced-repetition flashcard set with front/back and difficulty ratings",
    "interactive_lesson.json": "Step-by-step interactive lesson with explanations, exercises, and quizzes",
    "concept_map.json": "Graph of key concepts and their relationships (nodes + edges)",
    "images.json": "Set of educational image descriptions / AI image generation prompts",
}


@tool
def list_skills(tool_call_id: Annotated[str, InjectedToolCallId]) -> Command:
    """List all available content skill types the builder can generate.

    Returns:
        Command with a formatted list of skill names and descriptions in messages.
    """
    lines = ["Available skills (content types you can generate):\n"]
    for skill_key, description in SKILL_DESCRIPTIONS.items():
        lines.append(f"  • {skill_key}\n    {description}")
    lines.append(
        "\nUse get_skills(['type1', 'type2', ...]) to fetch generation instructions."
    )
    final_output = "\n".join(lines)
    return Command(
        update={
            "messages": [
                ToolMessage(
                    content=final_output,
                    tool_call_id=tool_call_id,
                )
            ]
        }
    )


@tool
def get_skills(
    resource_types: list[str],
    state: Annotated[dict, InjectedState],
    tool_call_id: Annotated[str, InjectedToolCallId],
) -> Command:
    """Fetch generation instructions for one or more content skill types at once.

    Use this to retrieve the detailed instructions for multiple resource types
    in a single call. Once you have the instructions, generate the content
    and use write() to save each file.

    Args:
        resource_types: List of resource/skill keys, e.g.
                        ['article.md', 'podcast.json', 'presentation.json']

    Returns:
        Generation instructions for each requested type, separated by headers.
    """
    if not resource_types:
        return "Error: resource_types list is empty. Provide at least one resource key."

    # Read spec from live state
    spec = state.get("spec")
    if spec and hasattr(spec, "topic"):
        topic = spec.topic
        experience_level = spec.experience_level
        focus_areas = spec.focus_areas
        preferred_depth = spec.preferred_depth
        source_summary = spec.source_summary or ""
    else:
        spec_dict = spec or {}
        topic = spec_dict.get("topic", "")
        experience_level = spec_dict.get("experience_level", "beginner")
        focus_areas = spec_dict.get("focus_areas", [])
        preferred_depth = spec_dict.get("preferred_depth", "moderate")
        source_summary = spec_dict.get("source_summary", "")

    available = set(RESOURCE_PROMPTS.keys())
    results = []

    for resource_type in resource_types:
        if resource_type not in available:
            results.append(
                f"=== '{resource_type}' — UNKNOWN SKILL ===\n"
                f"Available: {', '.join(sorted(available))}"
            )
            continue

        prompt = get_resource_prompt(
            resource_key=resource_type,
            topic=topic,
            experience_level=experience_level,
            focus_areas=focus_areas,
            preferred_depth=preferred_depth,
            source_summary=source_summary,
        )
        results.append(f"=== Instructions for '{resource_type}' ===\n\n{prompt}")

    separator = "\n\n" + "─" * 60 + "\n\n"
    final_output = "\n\n" + separator.join(results)
    
    return Command(
        update={
            "messages": [
                ToolMessage(
                    content=final_output,
                    tool_call_id=tool_call_id,
                )
            ]
        }
    )


# Flat list — no factory function needed
SKILL_TOOLS = [list_skills, get_skills]


def get_skill_tools(*args, **kwargs):
    """Backwards-compatible shim. Returns the module-level SKILL_TOOLS list."""
    return SKILL_TOOLS
