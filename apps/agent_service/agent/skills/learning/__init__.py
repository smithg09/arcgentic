"""
Learning skill loader — reads .md prompt files from the learning/ skill directory
and builds MODULE_DOCUMENTATION_SECTIONS for the visualization tools.
"""

from pathlib import Path

_LEARNING_DIR = Path(__file__).parent


def _load(name: str) -> str:
    """Load a single .md prompt file by name (without extension)."""
    path = _LEARNING_DIR / f"{name}.md"
    if not path.exists():
        raise FileNotFoundError(f"Learning prompt file not found: {path}")
    return path.read_text()


# Lazy-loaded section cache
_sections: dict[str, str] | None = None


def _get_sections() -> dict[str, str]:
    """Load all section files once from disk."""
    global _sections
    if _sections is None:
        _sections = {
            "ui_components": _load("ui_components"),
            "color_palette": _load("color_palette"),
            "svg_setup": _load("svg_setup"),
            "charts": _load("charts"),
            "diagram_types": _load("diagram_types"),
            "art": _load("art"),
            "base_documentation": _load("base_documentation"),
        }
    return _sections


def get_base_documentation() -> str:
    """Return the base documentation shown for all visualize_read_me calls."""
    return _get_sections()["base_documentation"]


def get_module_documentation_sections() -> dict[str, list[str]]:
    """
    Return the MODULE_DOCUMENTATION_SECTIONS mapping.

    Maps module names to lists of documentation section contents
    that should be included when that module is requested.
    """
    s = _get_sections()
    return {
        "diagram": [
            s["color_palette"],
            s["svg_setup"],
            s["diagram_types"],
        ],
        "mockup": [
            s["ui_components"],
            s["color_palette"],
        ],
        "interactive": [
            s["ui_components"],
            s["color_palette"],
        ],
        "data_viz": [
            s["ui_components"],
            s["color_palette"],
            s["charts"],
        ],
        "art": [
            s["svg_setup"],
            s["art"],
        ],
        "chart": [
            s["ui_components"],
            s["color_palette"],
            s["charts"],
        ],
    }
