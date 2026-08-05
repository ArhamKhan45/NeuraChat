"""Services for generating assistant responses."""

from typing import Any
import logging
import re

from sqlalchemy import select

from app.agents.supervisor_agent import supervisor_agent
from app.features.model_configuration.model import ModelConfiguration
from app.features.user.model import UserModel
from app.utils.dependency import (
    DatabaseSession,
    ProtectedUser,
)


async def generate_assistant_reply(
    message: str,
    clerk_id: ProtectedUser,
    db: DatabaseSession,
) -> str:
    """Generate a response through the NeuroChat supervisor."""

    result = await db.execute(
        select(ModelConfiguration)
        .join(
            UserModel,
            ModelConfiguration.user_id == UserModel.id,
        )
        .where(
            UserModel.clerk_id == clerk_id,
            ModelConfiguration.model_type.in_(
                [
                    "chat",
                    "agent",
                ]
            ),
        )
    )

    configurations = list(result.scalars().all())

    chat_configuration = next(
        (
            configuration
            for configuration in configurations
            if configuration.model_type == "chat"
        ),
        None,
    )

    agent_configuration = next(
        (
            configuration
            for configuration in configurations
            if configuration.model_type == "agent"
        ),
        None,
    )

    if chat_configuration is None:
        raise ValueError(
            "Chat model configuration was not found"
        )

    # When no separate agent model exists, all specialist agents
    # use the chat model configuration.
    active_agent_configuration = (
        agent_configuration or chat_configuration
    )

    supervisor = supervisor_agent(
        chat_model=chat_configuration.model_name,
        chat_provider=chat_configuration.provider,
        chat_api_key=chat_configuration.api_key,
        chat_model_url=chat_configuration.model_url,
        agent_model=active_agent_configuration.model_name,
        agent_provider=active_agent_configuration.provider,
        agent_api_key=active_agent_configuration.api_key,
        agent_model_url=active_agent_configuration.model_url,
    )

    supervisor_result = await supervisor.ainvoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": message,
                }
            ]
        }
    )

    try:
        response = get_final_response(supervisor_result)
        return enforce_word_limit(response, message)

    except Exception as error:
        logging.exception("Error extracting final response from supervisor_result: %r", error)
        # Re-raise so the router can handle and return a 500
        raise


def get_final_response(
    result: dict[str, Any],
) -> str:
    """Extract the final text returned by the supervisor."""

    messages = result.get("messages", [])

    if not messages:
        raise ValueError(
            "The supervisor did not return a response"
        )

    last_message = messages[-1]
    content = None

    if isinstance(last_message, dict):
        content = last_message.get("content") or last_message.get("text")
    else:
        content = getattr(last_message, "content", None) or getattr(last_message, "text", None)

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        text_parts: list[str] = []

        for block in content:
            if isinstance(block, str):
                text_parts.append(block)
                continue

            if isinstance(block, dict):
                text = block.get("text")

                if isinstance(text, str):
                    text_parts.append(text)

        if text_parts:
            return "\n".join(text_parts)

    return str(content)


def enforce_word_limit(
    response: str,
    user_message: str,
) -> str:
    """Enforce explicit word count requests found in the user's message."""

    normalized_message = user_message.strip().lower()
    match = re.search(
        r"\b(?:just\s+|in\s+|up\s+to\s+|at\s+most\s+|no\s+more\s+than\s+)?(\d+)\s+words?\b",
        normalized_message,
    )

    if not match:
        return response

    try:
        limit = int(match.group(1))
    except ValueError:
        return response

    words = response.strip().split()

    if len(words) <= limit:
        return response

    return " ".join(words[:limit])