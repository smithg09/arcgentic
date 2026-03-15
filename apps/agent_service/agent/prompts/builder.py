"""
Builder agent prompt — dynamic content generation templates.
"""

BUILDER_SYSTEM_PROMPT = """You are the Builder Agent in a learning resource generator system.

Your job is to generate high-quality learning resources based on the finalized learning spec.
You have access to tools to manage content files in the session state.

## Available Tools
- `write(filename, content)` — Create/overwrite a content file
- `read(filename)` — Read an existing content file
- `edit(filename, old_content, new_content)` — Edit part of an existing file
- `patch(filename, patch_str)` — Apply a unified diff patch
- `ls()` — List all content files
- `grep(pattern, filename?)` — Search content files
- `write_todo(task, category)` — Track your progress
- `update_todo(task_id, status)` — Update task status

## Workflow

1. First, create a todo list of all resources to generate using `write_todo`.
2. For each resource, use `get_skills` to fetch its instructions.
3. Generate the resource and **YOU MUST SAVE IT USING THE `write` TOOL**. 
4. Mark each todo as done when complete using `update_todo`.
5. After all resources are generated and saved via `write`, report completion.

## CRITICAL RULES
- **NEVER** output the generated content directly in your text response.
- **ALWAYS** use the `write(filename, content)` tool to save the generated content.
- If you just output the text without calling `write`, the system will not save it and you will fail.

## Learning Spec
- **Topic**: {topic}
- **Level**: {experience_level}
- **Focus Areas**: {focus_areas}
- **Goals**: {learning_goals}
- **Depth**: {preferred_depth}
- **Source Summary**: {source_summary}

## Quality Guidelines
- Tailor content to the specified experience level
- Focus on the specified focus areas
- Ensure content depth matches preferred_depth
- Use source materials as reference when available
- Make content engaging, accurate, and actionable
"""

# ─────────────────────────────────────────────────────────────────────
# Dynamic per-resource-type prompts
# ─────────────────────────────────────────────────────────────────────

RESOURCE_PROMPTS: dict[str, str] = {
    "article.md": """Generate a comprehensive learning article in Markdown format.

Structure:
- Title (H1)
- Introduction / Overview
- Prerequisites (if any)
- Main sections with clear headings (H2, H3)
- Code examples or practical demonstrations where relevant
- Key takeaways
- Further reading suggestions

Write for a {experience_level} audience focused on: {focus_areas}.
Depth: {preferred_depth}. Topic: {topic}.

{source_context}""",

    "podcast.json": """Generate a podcast script as JSON.

Format:
```json
{{
    "title": "Episode title",
    "description": "Episode description",
    "estimated_duration_minutes": 15,
    "segments": [
        {{
            "type": "intro" | "discussion" | "example" | "qa" | "outro",
            "speaker": "host" | "expert" | "narrator",
            "text": "What the speaker says",
            "duration_seconds": 60,
            "notes": "Production notes"
        }}
    ]
}}
```

Create an engaging conversational podcast for {experience_level} learners about {topic}.
Focus on: {focus_areas}. Depth: {preferred_depth}.

{source_context}""",

    "video_script.json": """Generate a video script as JSON.

Format:
```json
{{
    "title": "Video title",
    "description": "Video description",
    "estimated_duration_minutes": 10,
    "scenes": [
        {{
            "scene_number": 1,
            "type": "intro" | "explanation" | "demo" | "summary",
            "narration": "What the narrator says",
            "visuals": "Description of what should be shown on screen",
            "duration_seconds": 30,
            "notes": "Production notes"
        }}
    ]
}}
```

Create a clear, visual learning video for {experience_level} learners about {topic}.
Focus on: {focus_areas}. Depth: {preferred_depth}.

{source_context}""",

    "flashcards.json": """Generate a set of flashcards as JSON.

Format:
```json
{{
    "title": "Flashcard set title",
    "description": "Set description",
    "cards": [
        {{
            "id": 1,
            "category": "Category name",
            "difficulty": "easy" | "medium" | "hard",
            "front": "Question or term",
            "back": "Answer or definition",
            "hint": "Optional hint"
        }}
    ]
}}
```

Generate 20-30 flashcards for {experience_level} learners about {topic}.
Focus on: {focus_areas}. Depth: {preferred_depth}.
Include a mix of difficulties. Cover key concepts, definitions, and practical scenarios.

{source_context}""",

    "presentation.json": """Generate a presentation as JSON.

Format:
```json
{{
    "title": "Presentation title",
    "subtitle": "Subtitle",
    "slides": [
        {{
            "slide_number": 1,
            "type": "title" | "content" | "code" | "diagram" | "summary",
            "title": "Slide title",
            "bullets": ["Point 1", "Point 2"],
            "notes": "Speaker notes",
            "visual_suggestion": "What visual/diagram to include"
        }}
    ]
}}
```

Create a 15-20 slide presentation for {experience_level} learners about {topic}.
Focus on: {focus_areas}. Depth: {preferred_depth}.

{source_context}""",

    "interactive_lesson.json": """Generate an interactive lesson as JSON.

Format:
```json
{{
    "title": "Lesson title",
    "description": "Lesson overview",
    "estimated_duration_minutes": 30,
    "steps": [
        {{
            "step_number": 1,
            "type": "explanation" | "exercise" | "quiz" | "challenge",
            "title": "Step title",
            "content": "Instructional content (Markdown supported)",
            "exercise": {{
                "instructions": "What the learner should do",
                "starter_code": "Optional starter code",
                "solution": "Expected solution",
                "hints": ["Hint 1", "Hint 2"]
            }},
            "quiz": {{
                "question": "Quiz question",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "A",
                "explanation": "Why this is correct"
            }}
        }}
    ]
}}
```

Create an interactive lesson for {experience_level} learners about {topic}.
Focus on: {focus_areas}. Depth: {preferred_depth}.
Include a mix of explanations, hands-on exercises, and quizzes.

{source_context}""",

    "concept_map.json": """Generate a concept map as JSON.

Format:
```json
{{
    "title": "Concept map title",
    "description": "Map overview",
    "nodes": [
        {{
            "id": "node_1",
            "label": "Concept name",
            "type": "core" | "sub" | "related" | "example",
            "description": "Brief description"
        }}
    ],
    "edges": [
        {{
            "source": "node_1",
            "target": "node_2",
            "label": "relationship description",
            "type": "contains" | "requires" | "relates_to" | "leads_to"
        }}
    ]
}}
```

Create a comprehensive concept map for {experience_level} learners about {topic}.
Focus on: {focus_areas}. Depth: {preferred_depth}.
Structure as a graph showing key concepts and their relationships.

{source_context}""",

    "images.json": """Generate image descriptions/prompts for educational illustrations as JSON.

Format:
```json
{{
    "title": "Image set title",
    "images": [
        {{
            "id": 1,
            "title": "Image title",
            "description": "What this image illustrates",
            "prompt": "Detailed image generation prompt for Imagen API",
            "type": "diagram" | "infographic" | "illustration" | "screenshot",
            "alt_text": "Accessibility alt text"
        }}
    ]
}}
```

Create 5-8 educational image descriptions for {experience_level} learners about {topic}.
Focus on: {focus_areas}. Depth: {preferred_depth}.
Make prompts specific and detailed for high-quality AI image generation.

{source_context}""",
}


def get_resource_prompt(
    resource_key: str,
    topic: str,
    experience_level: str,
    focus_areas: list[str],
    preferred_depth: str,
    source_summary: str = "",
) -> str:
    """
    Get the formatted prompt for a specific resource type.

    Args:
        resource_key: The content file key (e.g. "article.md").
        topic: Learning topic.
        experience_level: User's experience level.
        focus_areas: List of focus areas.
        preferred_depth: Desired content depth.
        source_summary: Summary of source materials.

    Returns:
        Formatted prompt string.
    """
    template = RESOURCE_PROMPTS.get(resource_key, "")
    if not template:
        return f"Generate learning content about {topic} for {experience_level} learners.\n\nCRITICAL: DO NOT output the text here! ALWAYS call the write() tool to save this."

    source_context = ""
    if source_summary:
        source_context = f"Reference materials summary:\n{source_summary}"

    res = template.format(
        topic=topic,
        experience_level=experience_level,
        focus_areas=", ".join(focus_areas),
        preferred_depth=preferred_depth,
        source_context=source_context,
    )
    
    res += f"\n\nCRITICAL: DO NOT OUTPUT THE GENERATED CONTENT AS TEXT! YOU MUST IMMEDIATELY CALL THE `write` TOOL WITH filename '{resource_key}' AND Pass the content!"
    return res
