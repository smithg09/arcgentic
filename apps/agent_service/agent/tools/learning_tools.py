from typing import Literal, List, Optional

from langchain_core.tools import tool

from agent.skills.learning import get_base_documentation, get_module_documentation_sections


@tool
def visualize_read_me(modules: Optional[List[Literal['diagram', 'mockup', 'interactive', 'data_viz', 'chart', 'art']]] = None) -> str:
    """
    STEP 1 of 2: Load design guidelines before creating a visual.
    This returns documentation and code examples — NOT a rendered visual.
    After receiving the output, you MUST call `show_widget` (step 2) with your own SVG/HTML code
    to actually display something to the user. Without calling show_widget, the user sees nothing.
    Do NOT mention this call to the user — it is an internal setup step.
    Available modules: 'diagram', 'mockup', 'interactive', 'data_viz', 'chart', 'art'.
    """
    if modules is None:
        modules = []

    module_docs = get_module_documentation_sections()
    seen_sections = set()
    documentation_parts = [get_base_documentation()]

    for module_name in modules:
        sections = module_docs.get(module_name, [])
        for section in sections:
            if section not in seen_sections:
                seen_sections.add(section)
                documentation_parts.append(section)

    documentation_parts.append(
        "\n---\n**IMPORTANT REMINDER**: The above is documentation for you to reference. "
        "It is NOT a rendered visual. You MUST now call `show_widget(title, widget_code)` "
        "with your own SVG or HTML code to display the visualization to the user."
    )
    return "\n\n".join(documentation_parts)


@tool
def show_widget(title: str, widget_code: str) -> str:
    """
    Show visual content — SVG graphics, diagrams, charts, or interactive HTML widgets — that renders inline alongside your text response.\nUse for flowcharts, architecture diagrams, dashboards, forms, calculators, data tables, games, illustrations, or any visual content.\nThe code is auto-detected: starts with <svg = SVG mode, otherwise HTML mode.\nA global sendPrompt(text) function is available — it sends a message to chat as if the user typed it.\nIMPORTANT: Call read_me before your first show_widget call. Do NOT narrate or mention the read_me call to the user — call it silently, then respond as if you went straight to building the visualization.
    Calling this stores the title and widget_code in your Tool Call message history so the UI  can render the widget for the user. Do all formatting required.
    
    Args:
        title (str): Title or topic of the widget.
        widget_code (str): SVG or HTML code to render. For SVG: raw SVG code starting with <svg> tag, must use CSS variables for colors. Example: <svg viewBox="0 0 700 400" xmlns="http://www.w3.org/2000/svg">...</svg>. For HTML: raw HTML content to render, do NOT include DOCTYPE, <html>, <head>, or <body> tags. Use CSS variables for theming. Keep background transparent and avoid top-level padding. Scripts are supported but execute after streaming completes.
    """
    # As requested by the user, this does not mutate state["content"].
    # The pure presence of the ToolCall and ToolMessage in the LangGraph thread acts as the artifact.
    return f"Successfully generated widget '{title}'. Continue teaching the user."

LEARNING_TOOLS = [visualize_read_me, show_widget]
