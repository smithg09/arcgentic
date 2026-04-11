"""
Model provider factory — creates the correct LangChain BaseChatModel
based on user-supplied configuration or ENV fallback.

Supported providers:
    - openai      → ChatOpenAI
    - anthropic   → ChatAnthropic
    - google      → ChatGoogleGenerativeAI
    - openrouter  → ChatOpenAI (custom base_url)
    - ollama      → ChatOllama
    - lmstudio    → ChatOpenAI (custom base_url, OpenAI-compatible)
"""

from __future__ import annotations

import os
from typing import Optional

from pydantic import BaseModel, Field


class NoProviderConfiguredError(Exception):
    """Raised when no LLM provider is configured (neither FE config nor ENV)."""
    pass


class ModelConfig(BaseModel):
    """User-supplied model configuration from the frontend."""

    provider: str = ""          # "openai" | "anthropic" | "google" | "openrouter" | "ollama"
    model: str = ""             # e.g. "gpt-4.1", "claude-sonnet-4-20250514", "gemini-2.5-flash"
    api_key: str = ""           # user-provided key (optional if ENV has one)
    base_url: str = ""          # for ollama/openrouter custom endpoints
    temperature: Optional[float] = None
    top_p: Optional[float] = None


# ─────────────────────────────────────────────────────────────────────────────
# Provider detection from ENV
# ─────────────────────────────────────────────────────────────────────────────

def detect_env_providers() -> dict:
    """Return a dict of which providers have keys/config set via ENV."""
    return {
        "openai": bool(os.getenv("OPENAI_API_KEY")),
        "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
        "google": bool(os.getenv("GOOGLE_API_KEY")),
        "openrouter": bool(os.getenv("OPENROUTER_API_KEY")),
        "ollama": bool(os.getenv("OLLAMA_BASE_URL")),
        "lmstudio": bool(os.getenv("LMSTUDIO_BASE_URL")),
    }


def _get_env_fallback_provider() -> tuple[str, str, str]:
    """
    Determine the best provider from ENV.

    Returns (provider, model, api_key) or raises NoProviderConfiguredError.
    """
    if os.getenv("OPENAI_API_KEY"):
        return (
            "openai",
            os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            os.getenv("OPENAI_API_KEY", ""),
        )
    if os.getenv("ANTHROPIC_API_KEY"):
        return (
            "anthropic",
            os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
            os.getenv("ANTHROPIC_API_KEY", ""),
        )
    if os.getenv("GOOGLE_API_KEY"):
        return (
            "google",
            os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            os.getenv("GOOGLE_API_KEY", ""),
        )
    if os.getenv("OPENROUTER_API_KEY"):
        return (
            "openrouter",
            os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
            os.getenv("OPENROUTER_API_KEY", ""),
        )
    if os.getenv("OLLAMA_BASE_URL"):
        return (
            "ollama",
            os.getenv("OLLAMA_MODEL", "llama3"),
            "",
        )
    raise NoProviderConfiguredError(
        "No LLM provider configured. Please set API keys in the environment "
        "or configure a provider in the settings."
    )


def get_chat_model(config: ModelConfig | None = None, defaults: dict | None = None):
    """
    Create and return a LangChain chat model based on config or ENV fallback.

    Args:
        config:   Optional ModelConfig from frontend. If None, falls back to ENV.
        defaults: Dict of default kwargs (temperature, top_p, streaming, etc.).
                  FE-supplied values in config override these.

    Returns:
        A LangChain BaseChatModel instance.

    Raises:
        NoProviderConfiguredError if no provider is available.
    """
    defaults = defaults or {}

    if config and config.provider and config.model:
        provider = config.provider.lower()
        model = config.model
        api_key = config.api_key
        base_url = config.base_url
    else:
        # ENV fallback
        provider, model, api_key = _get_env_fallback_provider()
        base_url = ""

    # Merge temperatures: FE config > defaults
    temperature = defaults.get("temperature", 0.7)
    top_p = defaults.get("top_p", 1.0)
    streaming = defaults.get("streaming", False)

    if config and config.temperature is not None:
        temperature = config.temperature
    if config and config.top_p is not None:
        top_p = config.top_p

    # ── Provider-specific instantiation ──────────────────────────────────

    if provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=model,
            api_key=api_key or os.getenv("OPENAI_API_KEY"),
            temperature=temperature,
            top_p=top_p,
            streaming=streaming,
        )

    elif provider == "anthropic":
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=model,
            api_key=api_key or os.getenv("ANTHROPIC_API_KEY"),
            temperature=temperature,
            top_p=top_p,
            streaming=streaming,
        )

    elif provider == "google":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=model,
            google_api_key=api_key or os.getenv("GOOGLE_API_KEY"),
            temperature=temperature,
            top_p=top_p,
            streaming=streaming,
        )

    elif provider == "openrouter":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=model,
            api_key=api_key or os.getenv("OPENROUTER_API_KEY"),
            base_url=base_url or "https://openrouter.ai/api/v1",
            temperature=temperature,
            top_p=top_p,
            streaming=streaming,
        )

    elif provider == "ollama":
        from langchain_ollama import ChatOllama
        return ChatOllama(
            model=model,
            base_url=base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            temperature=temperature,
            top_p=top_p,
        )

    elif provider == "lmstudio":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=model,
            api_key=api_key or "lm-studio",  # LM Studio doesn't require a real key
            base_url=base_url or os.getenv("LMSTUDIO_BASE_URL", "http://localhost:1234/v1"),
            temperature=temperature,
            top_p=top_p,
            streaming=streaming,
        )

    else:
        raise NoProviderConfiguredError(
            f"Unknown provider '{provider}'. "
            "Supported: openai, anthropic, google, openrouter, ollama, lmstudio."
        )
