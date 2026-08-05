"""NeuroChat supervisor agent."""

from __future__ import annotations

import json
import logging
import re
from typing import (
    Any,
    Literal,
    Protocol,
    cast,
)

from app.agents.chat_agent import chat_agent
from app.agents.coding_agent import coding_agent
from app.agents.common import create_chat_model
from app.agents.planning_agent import planning_agent
from app.agents.research_agent import research_agent


logger = logging.getLogger(__name__)


AgentName = Literal[
    "coding",
    "planning",
    "research",
    "chat",
]


class InvokableAgent(Protocol):
    """Asynchronous interface shared by specialist agents."""

    async def ainvoke(
        self,
        input: dict[str, Any],
    ) -> Any:
        """Invoke the agent asynchronously."""


class SupervisorAgent:
    """Use an LLM to route requests to specialist agents."""

    def __init__(
        self,
        *,
        router_model: Any,
        coding: InvokableAgent,
        planning: InvokableAgent,
        research: InvokableAgent,
        general_chat: InvokableAgent,
    ) -> None:
        self.router_model = router_model
        self.coding = coding
        self.planning = planning
        self.research = research
        self.general_chat = general_chat

    async def ainvoke(
        self,
        input: dict[str, Any],
    ) -> Any:
        """
        Select a specialist and invoke it.

        The original user request is passed unchanged to ensure
        formatting and response-length constraints are preserved.
        """

        messages = input.get(
            "messages",
            [],
        )

        user_text = get_latest_user_text(
            messages
        )

        if not user_text:
            return create_assistant_result(
                "Please provide a message."
            )

        try:
            agent_name = await self._route_with_model(
                user_text=user_text,
            )

            selected_agent = self._get_agent(
                agent_name
            )

            logger.info(
                "Supervisor selected agent=%s",
                agent_name,
            )

            print(
                f"Selected agent: {agent_name}"
            )

            result = await selected_agent.ainvoke(
                {
                    "messages": [
                        {
                            "role": "user",
                            # Pass the original message unchanged.
                            "content": user_text,
                        }
                    ]
                }
            )

            response = extract_agent_content(
                result
            )

            if not response:
                raise ValueError(
                    f"The {agent_name} agent returned "
                    "an empty response."
                )

            response = apply_user_output_constraints(
                user_text=user_text,
                response=response,
            )

            logger.info(
                "%s agent returned: %s",
                agent_name,
                response[:200],
            )

            return create_assistant_result(
                response
            )

        except Exception:
            logger.exception(
                "Supervisor failed while processing "
                "the request."
            )

            return create_assistant_result(
                "I could not process that request. "
                "Please try again."
            )

    async def _route_with_model(
        self,
        *,
        user_text: str,
    ) -> AgentName:
        """
        Ask the router model to select one specialist.

        The router only classifies. It does not rewrite or answer
        the user's request.
        """

        system_prompt = """
You are NeuroChat's routing supervisor.

Your only job is to choose the most appropriate specialist agent.

Available agents:

coding:
Use for programming, debugging, software architecture, APIs,
databases, frameworks, technical errors, code reviews, testing,
deployment, and software implementation.

planning:
Use for roadmaps, project planning, implementation planning,
strategies, schedules, milestones, priorities, and breaking a
complex goal into actionable steps.

research:
Use when answering accurately requires live web search, current
information, external verification, or source comparison.

Examples include current events, politicians, public officials,
company leadership, weather, sports, prices, laws, schedules,
software releases, current product information, and recent news.

chat:
Use for normal conversation, timeless explanations, tutoring,
writing, brainstorming, definitions, and questions that do not
require live external information.

Routing rules:

1. Choose exactly one specialist.
2. Do not answer the user's request.
3. Do not rewrite the user's request.
4. Do not summarize the user's request.
5. Do not remove any user constraint.
6. Do not add facts or explanations.
7. Return only valid JSON.
8. If live or changing information is needed, select research.
9. If no specialist is clearly required, select chat.

Return exactly this structure:

{
  "tool": "coding | planning | research | chat"
}

Do not use Markdown.
Do not use a code block.
Do not include any text outside the JSON object.
""".strip()

        router_result = (
            await self.router_model.ainvoke(
                [
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": user_text,
                    },
                ]
            )
        )

        decision_text = extract_message_content(
            router_result
        )

        return parse_agent_decision(
            decision_text
        )

    def _get_agent(
        self,
        agent_name: AgentName,
    ) -> InvokableAgent:
        """Return the selected specialist agent."""

        agents: dict[
            AgentName,
            InvokableAgent,
        ] = {
            "coding": self.coding,
            "planning": self.planning,
            "research": self.research,
            "chat": self.general_chat,
        }

        return agents[agent_name]


def supervisor_agent(
    *,
    chat_model: str,
    chat_provider: str,
    chat_api_key: str,
    agent_model: str,
    agent_provider: str,
    agent_api_key: str,
    chat_model_url: str | None = None,
    agent_model_url: str | None = None,
) -> SupervisorAgent:
    """Create the supervisor and all specialist agents."""

    router_model = create_chat_model(
        model=chat_model,
        provider=chat_provider,
        api_key=chat_api_key,
        model_url=chat_model_url,
    )

    coding = coding_agent(
        model=agent_model,
        provider=agent_provider,
        api_key=agent_api_key,
        model_url=agent_model_url,
    )

    planning = planning_agent(
        model=agent_model,
        provider=agent_provider,
        api_key=agent_api_key,
        model_url=agent_model_url,
    )

    research = research_agent(
        model=agent_model,
        provider=agent_provider,
        api_key=agent_api_key,
        model_url=agent_model_url,
    )

    general_chat = chat_agent(
        model=agent_model,
        provider=agent_provider,
        api_key=agent_api_key,
        model_url=agent_model_url,
    )

    return SupervisorAgent(
        router_model=router_model,
        coding=coding,
        planning=planning,
        research=research,
        general_chat=general_chat,
    )


def parse_agent_decision(
    decision_text: str,
) -> AgentName:
    """Parse and validate the router model's response."""

    cleaned_text = remove_markdown_code_fence(
        decision_text
    )

    try:
        parsed = json.loads(
            cleaned_text
        )
    except json.JSONDecodeError:
        logger.warning(
            "Supervisor returned invalid JSON: %r",
            decision_text,
        )

        return "chat"

    if not isinstance(parsed, dict):
        logger.warning(
            "Supervisor response was not "
            "a JSON object: %r",
            parsed,
        )

        return "chat"

    raw_agent_name = str(
        parsed.get(
            "tool",
            "chat",
        )
    ).strip().lower()

    aliases: dict[str, AgentName] = {
        "search": "research",
        "web": "research",
        "web_search": "research",
        "research_agent": "research",
        "general": "chat",
        "general_chat": "chat",
        "chat_agent": "chat",
        "developer": "coding",
        "code": "coding",
        "coding_agent": "coding",
        "planner": "planning",
        "planning_agent": "planning",
    }

    alias = aliases.get(
        raw_agent_name
    )

    if alias is not None:
        return alias

    allowed_agents = {
        "coding",
        "planning",
        "research",
        "chat",
    }

    if raw_agent_name in allowed_agents:
        return cast(
            AgentName,
            raw_agent_name,
        )

    logger.warning(
        "Supervisor returned unsupported "
        "agent=%r",
        raw_agent_name,
    )

    return "chat"


def remove_markdown_code_fence(
    text: str,
) -> str:
    """Remove Markdown fences around a JSON response."""

    cleaned_text = text.strip()

    if not cleaned_text.startswith("```"):
        return cleaned_text

    cleaned_text = re.sub(
        r"^```(?:json)?\s*",
        "",
        cleaned_text,
        flags=re.IGNORECASE,
    )

    cleaned_text = re.sub(
        r"\s*```$",
        "",
        cleaned_text,
    )

    return cleaned_text.strip()


def get_latest_user_text(
    messages: list[Any],
) -> str:
    """Extract the latest user message."""

    for message in reversed(messages):
        if isinstance(message, dict):
            role = message.get(
                "role"
            )

            if role in {
                "user",
                "human",
            }:
                return stringify_content(
                    message.get(
                        "content"
                    )
                )

            continue

        message_type = getattr(
            message,
            "type",
            None,
        )

        if message_type in {
            "user",
            "human",
        }:
            return stringify_content(
                getattr(
                    message,
                    "content",
                    "",
                )
            )

    if not messages:
        return ""

    last_message = messages[-1]

    if isinstance(
        last_message,
        dict,
    ):
        return stringify_content(
            last_message.get(
                "content"
            )
        )

    return stringify_content(
        getattr(
            last_message,
            "content",
            "",
        )
    )


def extract_agent_content(
    result: Any,
) -> str:
    """Extract the final response from an agent result."""

    if result is None:
        return ""

    if isinstance(result, dict):
        messages = result.get(
            "messages"
        )

        if (
            isinstance(messages, list)
            and messages
        ):
            return extract_message_content(
                messages[-1]
            )

        for key in (
            "content",
            "text",
            "output",
            "answer",
        ):
            value = result.get(key)

            if value is not None:
                return stringify_content(
                    value
                )

    return extract_message_content(
        result
    )


def extract_message_content(
    message: Any,
) -> str:
    """Extract text from a LangChain message."""

    if message is None:
        return ""

    if isinstance(message, str):
        return message.strip()

    if isinstance(message, dict):
        for key in (
            "content",
            "text",
            "message",
        ):
            value = message.get(key)

            if value is not None:
                return stringify_content(
                    value
                )

        return str(message)

    content = getattr(
        message,
        "content",
        None,
    )

    if content is not None:
        return stringify_content(
            content
        )

    text = getattr(
        message,
        "text",
        None,
    )

    if text is not None:
        return stringify_content(
            text
        )

    return str(message)


def stringify_content(
    content: Any,
) -> str:
    """Convert message content or content blocks to text."""

    if content is None:
        return ""

    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        text_parts: list[str] = []

        for block in content:
            if isinstance(block, str):
                text_parts.append(
                    block
                )
                continue

            if not isinstance(
                block,
                dict,
            ):
                continue

            text = block.get(
                "text"
            )

            if isinstance(text, str):
                text_parts.append(
                    text
                )

        return "\n".join(
            text_parts
        ).strip()

    return str(content).strip()


def apply_user_output_constraints(
    *,
    user_text: str,
    response: str,
) -> str:
    """
    Enforce maximum word-count instructions after generation.

    This protects against models that ignore requested response length.
    """

    word_limit = extract_word_limit(
        user_text
    )

    if word_limit is None:
        return response.strip()

    words = response.split()

    if len(words) <= word_limit:
        return response.strip()

    truncated_words = words[:word_limit]

    return " ".join(
        truncated_words
    ).strip()


def extract_word_limit(
    user_text: str,
) -> int | None:
    """Extract an explicit word-count limit from the user request."""

    patterns = (
        r"\b(?:in|using)\s+(?:exactly\s+)?"
        r"(\d+)\s+words?\b",

        r"\b(?:answer|respond|reply)\s+"
        r"(?:in|using)\s+(?:exactly\s+)?"
        r"(\d+)\s+words?\b",

        r"\bmaximum\s+(?:of\s+)?"
        r"(\d+)\s+words?\b",

        r"\bmax\s+(\d+)\s+words?\b",

        r"\bno more than\s+"
        r"(\d+)\s+words?\b",

        r"\bnot more than\s+"
        r"(\d+)\s+words?\b",

        r"\bunder\s+"
        r"(\d+)\s+words?\b",

        r"\bwithin\s+"
        r"(\d+)\s+words?\b",
    )

    for pattern in patterns:
        match = re.search(
            pattern,
            user_text,
            flags=re.IGNORECASE,
        )

        if match is None:
            continue

        word_limit = int(
            match.group(1)
        )

        if word_limit > 0:
            return word_limit

    return None


def create_assistant_result(
    content: str,
) -> dict[str, list[dict[str, str]]]:
    """Create a minimal agent-compatible response."""

    return {
        "messages": [
            {
                "role": "assistant",
                "content": content,
            }
        ]
    }