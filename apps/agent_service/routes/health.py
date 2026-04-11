"""Health-check endpoints."""

from __future__ import annotations

from flask import Blueprint, jsonify

from agent.model_provider import detect_env_providers

health_bp = Blueprint("health", __name__)


@health_bp.route("/api/health", methods=["GET"])
def health_check():
    """Basic liveness probe."""
    return jsonify({"status": "healthy", "service": "ai-learning-agent"})


@health_bp.route("/api/health/providers", methods=["GET"])
def health_providers():
    """Return which LLM providers have API keys configured via ENV."""
    return jsonify({"providers": detect_env_providers()})
