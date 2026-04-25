"""
Application configuration and Flask app factory.
"""

from __future__ import annotations

import logging
import os

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from agent.graph import create_supervisor_graph
from agent.db import get_checkpointer

# ── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("arcgentic")

# ── Environment ──────────────────────────────────────────────────────────────

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://aiproject:aiproject@127.0.0.1:5433/aiproject",
)

# ── Graph singleton ─────────────────────────────────────────────────────────

_graph = None


async def get_graph():
    """Return the lazily-initialised LangGraph supervisor graph."""
    global _graph
    if _graph is not None:
        return _graph

    logger.info("Connecting to Postgres at: %s", DATABASE_URL)

    try:
        checkpointer = get_checkpointer(DATABASE_URL)
        _graph = create_supervisor_graph(checkpointer=checkpointer)
        logger.info("Postgres checkpointer initialised successfully")
        return _graph
    except Exception as e:
        logger.warning("Could not connect to Postgres: %s", e)
        logger.warning("Running without persistence (in-memory only)")
        _graph = create_supervisor_graph(checkpointer=None)
        return _graph


# ── App factory ──────────────────────────────────────────────────────────────


def create_app() -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)
    CORS(app)

    # Register route blueprints
    from routes.health import health_bp
    from routes.chat import chat_bp
    from routes.sessions import sessions_bp
    from routes.resources import resources_bp
    from routes.build import build_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(sessions_bp)
    app.register_blueprint(resources_bp)
    app.register_blueprint(build_bp)

    return app
