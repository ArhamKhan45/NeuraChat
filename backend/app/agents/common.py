"""Common factories for NeuroChat specialist agents."""

from __future__ import annotations

from typing import Any, Sequence

from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain_core.tools import BaseTool


GLOBAL_SYSTEM_PROMPT = """
You are part of the NeuroChat multi-agent system.

Follow the user's original request carefully.

Mandatory rules:

1. Follow explicit instructions about answer length, word count,
   formatting, language, tone, structure, and output type.

2. When the user requests a maximum number of words, do not
   intentionally exceed that limit.

3. When the user requests an exact number of words, aim to return
   exactly that number of words.

4. If the user requests JSON only, return valid JSON without
   Markdown or additional explanation.

5. If the user requests code only, return code without an
   introduction or conclusion.

6. Do not add unnecessary sections, summaries, introductions,
   conclusions, warnings, or examples.

7. Prefer a concise answer unless additional detail is requested.

8. Never invent facts, tools, imports, sources, APIs, or system
   details.

9. If reliable information is unavailable, clearly say so.

10. The latest explicit user instruction has priority over general
    response preferences.
""".strip()


def build_agent(
    *,
    model: str,
    provider: str,
    api_key: str,
    system_prompt: str,
    model_url: str | None = None,
    tools: Sequence[BaseTool | Any] | None = None,
):
    """Create a configured LangChain specialist agent."""

    llm = create_chat_model(
        model=model,
        provider=provider,
        api_key=api_key,
        model_url=model_url,
    )

    complete_system_prompt = (
        f"{GLOBAL_SYSTEM_PROMPT}\n\n"
        f"Specialist role:\n{system_prompt.strip()}"
    )

    return create_agent(
        model=llm,
        tools=list(tools or []),
        system_prompt=complete_system_prompt,
    )


def create_chat_model(
    *,
    model: str,
    provider: str,
    api_key: str,
    model_url: str | None = None,
):
    """Create a configured LangChain chat-model instance."""

    normalized_provider = normalize_provider(
        provider
    )

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
        model_arguments["base_url"] = (
            model_url.strip()
        )

    return init_chat_model(
        **model_arguments
    )


def normalize_provider(
    provider: str,
) -> str:
    """Map frontend provider values to LangChain provider names."""

    normalized_provider = (
        provider
        .strip()
        .lower()
        .replace("-", "_")
    )

    provider_aliases = {
        "google": "google_genai",
        "gemini": "google_genai",
        "hugging_face": "huggingface",
        "hf": "huggingface",
        "open_ai": "openai",
    }

    return provider_aliases.get(
        normalized_provider,
        normalized_provider,
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
    provider_prefix = f"{provider}:"

    if normalized_model.lower().startswith(
        provider_prefix.lower()
    ):
        return normalized_model[
            len(provider_prefix):
        ]

    return normalized_model