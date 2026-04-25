"""
Builder skill — resource-type generation prompt templates.

Each template is a format-string that accepts topic, experience_level,
focus_areas, preferred_depth, and learner_context placeholders.
"""

from __future__ import annotations


EXPLANATION_PROMPT = """Generate a comprehensive, richly-formatted Explanation in Markdown format.

You are creating a learning resource that should genuinely help someone understand this
topic from scratch (or deepen their existing knowledge). Go beyond plain text — leverage
the full power of Markdown to make the content visually engaging, easy to navigate, and
truly educational.

## Content Quality Standards
- **Accuracy first**: Every claim must be factually correct. If source materials are provided, ground your content in them.
- **Clarity over cleverness**: Prefer clear, direct explanations. Avoid jargon without definition.
- **Progressive complexity**: Start with foundational ideas and build toward advanced concepts naturally.
- **Concrete examples**: Every abstract concept should be paired with at least one concrete, relatable example.
- **Active learning hooks**: Include "Think about it" prompts, self-check questions, or mini-exercises throughout.

## Required Structure
- Title (H1) with a concise, descriptive headline
- Executive Summary / TL;DR (a short overview paragraph or callout — what will the reader learn and why it matters)
- Prerequisites (if any, as a checklist — be specific: "You should know X" not just "basic knowledge")
- Main sections with clear headings (H2, H3, H4 as needed), each section should:
  - Open with a brief context-setter (why this section matters)
  - Explain the core concept with examples
  - Include a practical takeaway or insight
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
- "Common Misconceptions" section — address 2-3 things learners frequently get wrong
- Key Takeaways section (bulleted summary of the most important points)
- Further Reading / Next Steps suggestions (with context on what each resource covers)

## Source Citations (REQUIRED when source materials are provided)
When you draw information from the learner's source materials, you MUST cite them:
- Place inline citation markers using the format `[[cite:N]]` immediately after the claim or sentence.

Rules:
- `excerpt` must be a VERBATIM quote from the source (15-80 words) — do NOT paraphrase.
- `source_name` must exactly match one of the provided source names.
- Only cite when you are genuinely drawing from source materials, not for general knowledge.

{learner_context}"""

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
            "text": "What the speaker says — MUST be 2-4 full, natural sentences. Use [[cite:N]] inline when referencing source materials.", (REQUIRED)
            "notes": "Production notes (optional)"
        }}
    ],
    "citations": [
        {{
            "id": 1,
            "source_name": "exact source filename or title",
            "excerpt": "verbatim passage from the source (15-80 words)"
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

{learner_context}"""

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
            "back": "Answer or definition — use [[cite:N]] when sourced from materials",
            "hint": "Optional hint"
        }}
    ],
    "citations": [
        {{
            "id": 1,
            "source_name": "exact source filename or title",
            "excerpt": "verbatim passage from the source (15-80 words)"
        }}
    ]
}}
```

## Content Guidelines
- Generate **20-30 flashcards** covering the full breadth of the topic.
- Include a mix of difficulties: ~30% easy (recall/definitions), ~50% medium (application/comparison), ~20% hard (analysis/edge cases).
- **Front (question) quality**: Ask specific, unambiguous questions. Avoid vague prompts like "What is X?" — prefer "How does X differ from Y?" or "What happens when X encounters Z?"
- **Back (answer) quality**: Provide complete, self-contained answers. Include a brief "why" or context, not just bare facts.
- **Hint quality**: Hints should nudge toward the answer without giving it away — think breadcrumbs, not spoilers.
- Cover: key concepts, definitions, practical scenarios, common mistakes, comparisons, and real-world applications.
- Cards should form a coherent learning sequence — foundational cards first, building to advanced ones.

{learner_context}"""

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
            "content": "Rich markdown content — use [[cite:N]] inline when referencing source materials",
            "notes": "Speaker notes — 2-3 sentences explaining what to say on this slide",
            "visual_suggestion": "Describe a visual, diagram, or chart that would complement this slide"
        }}
    ],
    "citations": [
        {{
            "id": 1,
            "source_name": "exact source filename or title",
            "excerpt": "verbatim passage from the source (15-80 words)"
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

{learner_context}"""

ROADMAP_PROMPT = """Generate a comprehensive, richly-connected roadmap as JSON. This roadmap is for the user, to discover connected learning paths and concepts to master the topic.  
    
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

{learner_context}"""


# ── Registry & accessor ──────────────────────────────────────────────────────

RESOURCE_PROMPTS: dict[str, str] = {
    "explanation.md": EXPLANATION_PROMPT,
    "podcast.json": PODCAST_PROMPT,
    "flashcards.json": FLASHCARDS_PROMPT,
    "presentation.json": PRESENTATION_PROMPT,
    "roadmap.json": ROADMAP_PROMPT,
}


# ── Learner context builder ──────────────────────────────────────────────────

_DEPTH_GUIDANCE = {
    "shallow": (
        "Keep explanations concise and high-level. Focus on the 'what' and 'why' "
        "rather than implementation minutiae. Use analogies and summaries over "
        "technical deep-dives. Aim for breadth of understanding."
    ),
    "moderate": (
        "Balance conceptual clarity with practical detail. Explain the 'how' alongside "
        "the 'what' and 'why'. Include concrete examples and moderate technical depth. "
        "Cover both theory and application."
    ),
    "deep": (
        "Provide thorough, expert-level coverage. Dive into internals, edge cases, "
        "trade-offs, and advanced patterns. Include detailed code examples, architecture "
        "discussions, and nuanced comparisons. Assume the reader wants mastery."
    ),
}

_LEVEL_GUIDANCE = {
    "beginner": (
        "The learner is new to this topic. Define all jargon and technical terms on "
        "first use. Build up from fundamentals — never assume prior knowledge. Use "
        "real-world analogies to bridge unfamiliar concepts. Prefer step-by-step "
        "explanations over dense paragraphs."
    ),
    "intermediate": (
        "The learner has foundational knowledge and some hands-on experience. Skip "
        "basic definitions but clarify nuanced or commonly confused concepts. Focus "
        "on deepening understanding, best practices, and practical application patterns."
    ),
    "advanced": (
        "The learner is experienced and looking for expert-level insight. Focus on "
        "advanced patterns, performance trade-offs, architectural decisions, edge cases, "
        "and emerging practices. Challenge assumptions and present multiple perspectives."
    ),
}


def _build_learner_context(
    *,
    topic: str,
    experience_level: str,
    focus_areas: list[str],
    preferred_depth: str,
    learning_goals: list[str],
    source_summary: str,
    source_names: list[str] | None = None,
) -> str:
    """Build a structured learner-profile context block for prompt injection."""
    sections: list[str] = []

    sections.append("---")
    sections.append("## Learner Profile & Content Requirements")
    sections.append("")
    sections.append(f"**Topic**: {topic}")
    sections.append(f"**Experience Level**: {experience_level}")

    # Level-specific pedagogical guidance
    level_guide = _LEVEL_GUIDANCE.get(
        experience_level.lower(),
        _LEVEL_GUIDANCE["intermediate"],
    )
    sections.append(f"  → {level_guide}")
    sections.append("")

    # Focus areas
    if focus_areas:
        sections.append("**Focus Areas** (prioritize these in your content):")
        for area in focus_areas:
            sections.append(f"  - {area}")
        sections.append("")

    # Learning goals — the learner's own words about what they want to achieve
    if learning_goals:
        sections.append(
            "**Learner's Goals** — the learner specifically wants to achieve the following. "
            "Shape your content to directly serve these goals:"
        )
        for goal in learning_goals:
            sections.append(f"  - {goal}")
        sections.append("")

    # Depth calibration
    depth_guide = _DEPTH_GUIDANCE.get(
        preferred_depth.lower(),
        _DEPTH_GUIDANCE["moderate"],
    )
    sections.append(f"**Content Depth**: {preferred_depth}")
    sections.append(f"  → {depth_guide}")
    sections.append("")

    # Source materials — authoritative grounding + citation instructions
    if source_summary:
        sections.append("**Source Materials** (provided by the learner):")
        sections.append(
            "The learner has provided the following reference materials. Treat these as "
            "your PRIMARY knowledge base for this content. Ground your explanations, "
            "examples, and data directly in these sources. Do NOT fabricate information "
            "that contradicts or goes beyond what these materials cover. When the sources "
            "are sufficient, prefer them over general knowledge."
        )
        sections.append("")

        # List available source names so the LLM can cite them correctly
        if source_names:
            sections.append("**Available sources** (use these EXACT names in citations):")
            for name in source_names:
                sections.append(f"  - `{name}`")
            sections.append("")

        sections.append(source_summary)
        sections.append("")

        # Citation instructions
        sections.append("### Citation Requirements")
        sections.append(
            "When you use information from the sources above, you MUST cite them using "
            "inline markers `[[cite:N]]` where N is an incrementing integer. Each citation "
            "must reference a VERBATIM excerpt (15-80 words) from the source. "
            "The `source_name` in each citation must exactly match one of the available "
            "source names listed above. If no source materials are provided, omit citations entirely."
        )
    else:
        sections.append(
            "*No source materials provided — use your general knowledge, but be "
            "factually accurate and cite well-known references where appropriate. "
            "Do NOT include a citations array/block since there are no source materials.*"
        )

    sections.append("---")
    return "\n".join(sections)


def get_resource_prompt(
    resource_key: str,
    topic: str,
    experience_level: str,
    focus_areas: list[str],
    preferred_depth: str,
    source_summary: str = "",
    learning_goals: list[str] | None = None,
    source_names: list[str] | None = None,
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
        learning_goals: What the learner wants to achieve.
        source_names: Exact names of the learner's source files/links.

    Returns:
        A fully-interpolated prompt string ready for LLM consumption.
    """
    template = RESOURCE_PROMPTS.get(resource_key, "")
    if not template:
        return (
            f"Generate learning content about {topic} for {experience_level} learners.\n\n"
            "CRITICAL: DO NOT output the text here! ALWAYS call the write() tool to save this."
        )

    # ── Build learner context block ──────────────────────────────────────
    learner_context = _build_learner_context(
        topic=topic,
        experience_level=experience_level,
        focus_areas=focus_areas,
        preferred_depth=preferred_depth,
        learning_goals=learning_goals or [],
        source_summary=source_summary,
        source_names=source_names or [],
    )

    res = template.format(
        topic=topic,
        experience_level=experience_level,
        focus_areas=", ".join(focus_areas),
        preferred_depth=preferred_depth,
        learner_context=learner_context,
    )

    if resource_key.endswith(".json"):
        res += "\n\n### CRITICAL JSON ESCAPING RULES\n"
        res += "You are generating a JSON payload that contains Markdown or long text. You MUST properly escape all special characters.\n"
        res += "1. NEVER use raw literal line breaks inside a JSON string. You MUST use the exact characters `\\n` instead of actual line breaks.\n"
        res += '2. Escape ALL inner double quotes using `\\"`. This is the #1 cause of broken JSON output.\n'
        res += '   BAD:  "text": "The phrase "it works on my machine" is common."\n'
        res += '   GOOD: "text": "The phrase \\"it works on my machine\\" is common."\n'
        res += "3. Escape inner backslashes using `\\\\`.\n"
        res += "4. Do NOT use smart/curly quotes (“ ”) as a workaround — use properly escaped straight quotes.\n"
        res += "Failure to properly escape strings will cause a catastrophic JSON parsing error."

    res += (
        f"\n\nCRITICAL: DO NOT OUTPUT THE GENERATED CONTENT AS TEXT! "
        f"YOU MUST IMMEDIATELY CALL THE `write` TOOL WITH filename '{resource_key}' AND Pass the content!"
    )
    return res
