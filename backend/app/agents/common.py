"""Common factory for NeuroChat specialist agents."""

from __future__ import annotations

from typing import Any, Sequence

from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain_core.tools import BaseTool


def build_agent(
    *,
    model: str,
    provider: str,
    api_key: str,
    model_url: str | None = None,
    system_prompt: str,
    tools: Sequence[BaseTool | Any] | None = None,
):
    """Create and return a configured LangChain agent."""

    normalized_provider = normalize_provider(provider)

    normalized_model = remove_provider_prefix(
        model=model,
        provider=normalized_provider,
    )

    model_arguments: dict[str, Any] = {
        "model": normalized_model,
        "model_provider": normalized_provider,
        "api_key": api_key,
        "temperature": 0.0,
    }

    if model_url and model_url.strip():
        model_arguments["base_url"] = model_url.strip()

    llm = init_chat_model(**model_arguments)

    return create_agent(
        model=llm,
        tools=list(tools or []),
        system_prompt=system_prompt,
    )


def normalize_provider(provider: str) -> str:
    """Map frontend provider names to LangChain provider names."""

    normalized = provider.strip().lower().replace(
        "-",
        "_",
    )

    aliases = {
        "google": "google_genai",
        "gemini": "google_genai",
        "hugging_face": "huggingface",
        "hf": "huggingface",
        "open_ai": "openai",
    }

    return aliases.get(
        normalized,
        normalized,
    )


def remove_provider_prefix(
    *,
    model: str,
    provider: str,
) -> str:
    """
    Remove provider:model syntax when provider is passed separately.

    Example:
        huggingface:meta-llama/Llama-3.1-8B-Instruct

    Becomes:
        meta-llama/Llama-3.1-8B-Instruct
    """

    normalized_model = model.strip()
    prefix = f"{provider}:"

    if normalized_model.lower().startswith(
        prefix.lower()
    ):
        return normalized_model[len(prefix):]

    return normalized_model


def create_chat_model(
    *,
    model: str,
    provider: str,
    api_key: str,
    model_url: str | None = None,
):
    """Create and return a configured chat model instance.

    This is a thin wrapper around `init_chat_model` so other modules
    can import a consistent helper for creating chat model instances.
    """

    normalized_provider = normalize_provider(provider)

    normalized_model = remove_provider_prefix(
        model=model,
        provider=normalized_provider,
    )

    model_arguments: dict[str, Any] = {
        "model": normalized_model,
        "model_provider": normalized_provider,
        "api_key": api_key,
        "temperature": 0.0,
    }

    if model_url and model_url.strip():
        model_arguments["base_url"] = model_url.strip()

    return init_chat_model(**model_arguments)