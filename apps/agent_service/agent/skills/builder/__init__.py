"""
Builder skill — resource-type generation prompt templates.

Each template is a format-string that accepts topic, experience_level,
focus_areas, preferred_depth, and source_context placeholders.
"""

from __future__ import annotations


EXPLANATION_PROMPT = """Generate a comprehensive, richly-formatted Explanation in Markdown format.

This explanation should break down the user's spec or source materials into a clear,
well-structured educational document. Go beyond plain text — leverage the full power
of Markdown to make the content visually engaging and easy to navigate.

Structure:
- Title (H1) with a concise, descriptive headline
- Executive Summary / TL;DR (a short overview paragraph or callout)
- Prerequisites (if any, as a checklist)
- Main sections with clear headings (H2, H3, H4 as needed)
- Use **Mermaid diagrams** (```mermaid ... ```) for:
  - Flowcharts to illustrate processes or workflows
  - Sequence diagrams for interactions
  - Mind maps for concept relationships
  - Class/ER diagrams for data structures
- Use **tables** to compare options, summarize properties, or present structured data
- Use **blockquotes** (> ) for key definitions, important quotes, or callouts
- Use **code blocks** with language tags for any code examples or technical snippets
- Use **numbered lists** for sequential steps, **bullet lists** for collections
- Use **bold** and *italic* for emphasis on key terms and concepts
- Key Takeaways section (bulleted summary of the most important points)
- Further Reading / Next Steps suggestions

Write for a {experience_level} audience focused on: {focus_areas}.
Depth: {preferred_depth}. Topic: {topic}.

{source_context}"""

PODCAST_PROMPT = """Generate a podcast script as JSON — a REAL, in-depth conversational podcast between two speakers.

Format:
```json
{{
    "title": "Episode title",
    "description": "Episode description — 2-3 sentences summarizing what listeners will learn",
    "estimated_duration_minutes": 15,
    "segments": [
        {{
            "type": "intro" | "discussion" | "example" | "analogy" | "deep_dive" | "qa" | "recap" | "outro",
            "speaker": "host" | "expert",
            "text": "What the speaker says — MUST be 2-4 full, natural sentences",
            "notes": "Production notes (optional)"
        }}
    ]
}}
```

## CRITICAL REQUIREMENTS — READ CAREFULLY

### Length & Depth
- Generate **25-40 segments minimum**. This is a real educational podcast, not a summary.
- Each segment's `text` MUST be **2-4 full sentences** of natural speech. One-liners are NOT acceptable.
- The estimated duration should be 15-20 minutes of real spoken content.

### Conversation Style
- This is a **natural back-and-forth conversation** between a Host and an Expert.
- The Host is curious, asks probing questions, relates concepts to real-world scenarios, and summarizes for the audience.
- The Expert provides deep knowledge, gives examples, explains nuances, and corrects common misconceptions.
- **Alternate speakers naturally** — avoid long monologues. After 2-3 expert segments, the host should react, ask a follow-up, or summarize.
- Use **natural conversational transitions**: "That's a great point...", "Building on that...", "Let me give you an example...", "So if I understand correctly...", "One thing people often get wrong is..."

### Required Flow Structure
1. **Intro** (2-3 segments): Host welcomes listeners, introduces the topic and the expert, previews what they'll cover
2. **Foundation** (4-6 segments): Set the stage — what is this topic, why does it matter, who should care
3. **Core Discussion** (10-15 segments): Deep dive into the main concepts, with examples and analogies
4. **Practical Examples** (4-6 segments): Real-world scenarios, case studies, "how would you actually use this"
5. **Common Mistakes & Tips** (3-4 segments): What beginners get wrong, pro tips
6. **Recap** (2-3 segments): Host summarizes key takeaways, expert adds final thoughts
7. **Outro** (1-2 segments): Thanks, where to learn more, closing

### Segment Types
- `intro`: Opening and scene-setting
- `discussion`: Core explanatory conversation
- `example`: Real-world examples, case studies, "imagine you're building..."
- `analogy`: Relatable analogies to make complex ideas click
- `deep_dive`: Technical deep dives into specific sub-topics
- `qa`: Host asks a pointed question, expert answers
- `recap`: Summarizing what's been covered so far
- `outro`: Closing remarks

Create this podcast for {experience_level} learners about {topic}.
Focus on: {focus_areas}. Depth: {preferred_depth}.

{source_context}"""

FLASHCARDS_PROMPT = """Generate a set of flashcards as JSON.

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

{source_context}"""

PRESENTATION_PROMPT = """Generate a content-rich presentation as JSON with **15-25 slides**.

Format:
```json
{{
    "title": "Presentation title",
    "subtitle": "Subtitle — a compelling one-liner",
    "slides": [
        {{
            "slide_number": 1,
            "type": "title" | "section" | "content" | "code" | "diagram" | "summary",
            "title": "Slide title",
            "content": "Rich markdown content — see requirements below",
            "notes": "Speaker notes — 2-3 sentences explaining what to say on this slide",
            "visual_suggestion": "Describe a visual, diagram, or chart that would complement this slide"
        }}
    ]
}}
```

## CRITICAL REQUIREMENTS — READ CAREFULLY

### Slide Content Richness
Each slide's `content` field MUST use **full Markdown formatting**. Do NOT write bare one-liners.
Every content slide should have at minimum 3-5 bullet points or a substantial paragraph.

Use these markdown features liberally:
- **Bullet lists** with sub-bullets for detailed breakdowns
- **Bold** and *italic* for emphasis on key terms
- **Code blocks** (```language ... ```) for any technical examples
- **Tables** (| header | header |) for comparisons, feature matrices, or property summaries
- **Blockquotes** (>) for key definitions or important callouts
- **Numbered lists** for sequential steps or processes

### Required Slide Flow (15-25 slides)
1. **Title slide** (`type: "title"`): Title + subtitle
2. **Agenda/Overview** (`type: "content"`): What we'll cover — numbered list of topics
3. **Why This Matters** (`type: "content"`): Problem statement, motivation, real-world relevance
4. **Section divider** (`type: "section"`): First major section header
5. **Core Concept slides** (3-5 slides, `type: "content"`): Each concept with bullet points, definitions, and examples
6. **Code Example** (`type: "code"`): Practical code or configuration example with explanation
7. **Section divider** (`type: "section"`): Second major section header
8. **Deep Dive slides** (3-5 slides, `type: "content"`): Detailed exploration with tables or comparisons
9. **Diagram slide** (`type: "diagram"`): Architecture, flow, or relationship diagram described in markdown
10. **Comparison Table** (`type: "content"`): A markdown table comparing approaches, tools, or strategies
11. **Best Practices** (`type: "content"`): Bullet-pointed recommendations
12. **Common Mistakes / Pitfalls** (`type: "content"`): What to avoid, with explanations
13. **Real-World Examples** (`type: "content"`): Case studies or practical scenarios
14. **Key Takeaways** (`type: "summary"`): Bulleted summary of the most important points
15. **Resources & Next Steps** (`type: "summary"`): Further reading, links, what to learn next

### Speaker Notes
Every slide MUST have `notes` — write 2-3 full sentences explaining what the presenter should say or emphasize on this slide. These are NOT one-word labels.

### Visual Suggestions
Most slides should have a `visual_suggestion` describing what kind of visual would enhance the slide (diagram type, chart, icon, screenshot, etc.).

Create this presentation for {experience_level} learners about {topic}.
Focus on: {focus_areas}. Depth: {preferred_depth}.

{source_context}"""

ROADMAP_PROMPT = """Generate a comprehensive, richly-connected roadmap as JSON.
    
Format:
```json
{{
    "title": "Roadmap title",
    "description": "Map overview — 1-2 sentences",
    "nodes": [
        {{
            "id": "node_1",
            "label": "Concept name (keep short, max 3-4 words)",
            "type": "core" | "sub" | "related" | "example",
            "prompt": "A detailed 5-6 sentence learning prompt — see requirements below",
            "description": "A full sentence explaining what this concept is and why it matters"
        }}
    ],
    "edges": [
        {{
            "source": "node_1",
            "target": "node_2",
            "label": "relationship description (2-4 words)",
            "type": "contains" | "requires" | "relates_to" | "leads_to"
        }}
    ]
}}
```

## CRITICAL REQUIREMENTS — READ CAREFULLY

### Node Count & Diversity
- Generate **15-25 nodes** that comprehensively cover the topic.
- Include a healthy mix of types:
  - At least **3-5 `core`** nodes: The central, foundational concepts
  - At least **5-8 `sub`** nodes: Important sub-topics that branch from core concepts
  - At least **3-4 `related`** nodes: Adjacent or prerequisite concepts
  - At least **3-4 `example`** nodes: Concrete examples, tools, or implementations

### Prompt Quality (VERY IMPORTANT)
Each node's `prompt` field is used to start a NEW learning session when a user clicks the node.
It must be a **detailed, self-contained learning prompt of 5-6 sentences** that:
- Clearly states what the learner should explore
- Mentions specific sub-topics or questions to investigate
- Is actionable as a standalone learning request

BAD example: "Kubernetes overview"
GOOD example: "Explore the fundamentals of Kubernetes, including its architecture with control plane and worker nodes, how it manages containerized workloads, and why it became the industry standard for container orchestration. Cover the key components like etcd, API server, scheduler, and kubelet."

### Description Quality
Each node's `description` must be a **full, informative sentence** — not a 2-3 word fragment.

BAD example: "Container orchestration platform"
GOOD example: "Kubernetes is an open-source container orchestration platform that automates deploying, scaling, and managing containerized applications across clusters of machines."

### Edge Density
- Generate **20-35 edges** to create a richly connected graph.
- Use meaningful, descriptive relationship labels (2-4 words).
- Ensure most nodes have at least 2 connections.
- Use all edge types: `contains`, `requires`, `relates_to`, `leads_to`.

Create this roadmap for {experience_level} learners about {topic}.
Focus on: {focus_areas}. Depth: {preferred_depth}.

{source_context}"""


# ── Registry & accessor ──────────────────────────────────────────────────────

RESOURCE_PROMPTS: dict[str, str] = {
    "explanation.md": EXPLANATION_PROMPT,
    "podcast.json": PODCAST_PROMPT,
    "flashcards.json": FLASHCARDS_PROMPT,
    "presentation.json": PRESENTATION_PROMPT,
    "roadmap.json": ROADMAP_PROMPT,
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
    Return the formatted prompt for a specific resource type.

    Args:
        resource_key: Content file key (e.g. ``"explanation.md"``).
        topic: Learning topic.
        experience_level: User's experience level.
        focus_areas: Specific areas to focus on.
        preferred_depth: Desired content depth.
        source_summary: Summary of user-provided source materials.

    Returns:
        A fully-interpolated prompt string ready for LLM consumption.
    """
    template = RESOURCE_PROMPTS.get(resource_key, "")
    if not template:
        return (
            f"Generate learning content about {topic} for {experience_level} learners.\n\n"
            "CRITICAL: DO NOT output the text here! ALWAYS call the write() tool to save this."
        )

    source_context = ""
    if source_summary:
        source_context = (
            "Ground your response and data from the following source materials, "
            f"DO NOT MAKE ANY ASSUMPTIONS:\n{source_summary}"
        )

    res = template.format(
        topic=topic,
        experience_level=experience_level,
        focus_areas=", ".join(focus_areas),
        preferred_depth=preferred_depth,
        source_context=source_context,
    )

    if resource_key.endswith(".json"):
        res += "\n\n### CRITICAL JSON ESCAPING RULES\n"
        res += "You are generating a JSON payload that contains Markdown or long text. You MUST properly escape all special characters.\n"
        res += "1. NEVER use raw literal line breaks inside a JSON string. You MUST use the exact characters `\\n` instead of actual line breaks.\n"
        res += '2. Escape inner double quotes using `\\"`.\n'
        res += "3. Escape inner backslashes using `\\\\`.\n"
        res += "Failure to properly escape strings will cause a catastrophic JSON parsing error."

    res += (
        f"\n\nCRITICAL: DO NOT OUTPUT THE GENERATED CONTENT AS TEXT! "
        f"YOU MUST IMMEDIATELY CALL THE `write` TOOL WITH filename '{resource_key}' AND Pass the content!"
    )
    return res
