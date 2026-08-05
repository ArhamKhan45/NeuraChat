"""NeuroChat research agent with live web search."""

from __future__ import annotations

import json
import logging

from ddgs import DDGS
from langchain.tools import tool

from app.agents.common import build_agent


logger = logging.getLogger(__name__)


@tool
def search_web(query: str) -> str:
    """
    Search the live web for current and externally verifiable information.

    Use this for current office holders, politicians, news, weather,
    prices, sports, schedules, laws, recent events, software versions,
    product availability, and company leadership.
    """

    normalized_query = query.strip()

    if not normalized_query:
        return json.dumps(
            {
                "status": "error",
                "message": "Search query cannot be empty.",
                "results": [],
            }
        )

    try:
        raw_results = DDGS(
            timeout=15,
        ).text(
            query=normalized_query,
            max_results=8,
        )

        cleaned_results: list[dict[str, str]] = []

        for result in raw_results:
            if not isinstance(result, dict):
                continue

            title = str(
                result.get("title", "")
            ).strip()

            url = str(
                result.get("href")
                or result.get("url")
                or ""
            ).strip()

            snippet = str(
                result.get("body")
                or result.get("snippet")
                or result.get("description")
                or ""
            ).strip()

            if not url:
                continue

            cleaned_results.append(
                {
                    "title": title or "Untitled result",
                    "url": url,
                    "snippet": snippet,
                }
            )

        logger.info(
            "Web search query=%r returned %d results",
            normalized_query,
            len(cleaned_results),
        )

        if not cleaned_results:
            return json.dumps(
                {
                    "status": "no_results",
                    "query": normalized_query,
                    "results": [],
                },
                ensure_ascii=False,
            )

        return json.dumps(
            {
                "status": "success",
                "query": normalized_query,
                "results": cleaned_results,
            },
            ensure_ascii=False,
        )

    except Exception as error:
        logger.exception(
            "Web search failed for query=%r",
            normalized_query,
        )

        return json.dumps(
            {
                "status": "error",
                "query": normalized_query,
                "message": str(error),
                "results": [],
            },
            ensure_ascii=False,
        )


def research_agent(
    model: str,
    provider: str,
    api_key: str,
    model_url: str | None = None,
):
    """Create the research agent with live web-search access."""

    return build_agent(
        model=model,
        provider=provider,
        api_key=api_key,
        model_url=model_url,
        system_prompt=(
            "You are NeuroChat's live research specialist. "
            "You have access to the search_web tool. "

            "You must call search_web before answering questions involving "
            "current, recent, changing, uncertain, or externally verifiable "
            "information. This includes current politicians, chief ministers, "
            "presidents, prime ministers, company leaders, news, weather, "
            "prices, sports scores, laws, schedules, product availability, "
            "software versions, and recent events. "

            "For example, if the user asks who the current Chief Minister "
            "of Delhi is, call search_web before answering. "

            "Do not answer current-information questions only from memory. "
            "Do not mention a knowledge cutoff after a successful search. "
            "Do not tell the user to search elsewhere when usable search "
            "results were returned. "

            "Prefer official government websites, official organizations, "
            "primary sources, and reputable news publications. "
            "Compare multiple results whenever possible. "

            "Use only claims supported by the search results. "
            "If results conflict, explain the conflict. "
            "If the search fails or returns no usable results, clearly say "
            "that the current information could not be verified. "

            "Give the direct answer first. "
            "Then provide a concise explanation and list the source URLs."
        ),
        tools=[
            search_web,
        ],
    )