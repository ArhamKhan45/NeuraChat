"""NeuroChat supervisor agent."""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Literal, Protocol, cast

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
    """Common asynchronous interface for specialist agents."""

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
        """Select and invoke the appropriate specialist agent."""

        messages = input.get("messages", [])

        user_text = get_latest_user_text(messages)

        if not user_text:
            return create_assistant_result(
                "Please provide a message."
            )

        try:
            agent_name, task = await self._route_with_model(
                user_text=user_text,
            )

            selected_agent = self._get_agent(
                agent_name
            )

            logger.info(
                "Supervisor selected agent=%s task=%r",
                agent_name,
                task[:200],
            )

            # Print the selected agent to the console for visibility
            print(f"Selected agent: {agent_name}")

            result = await selected_agent.ainvoke(
                {
                    "messages": [
                        {
                            "role": "user",
                            "content": task,
                        }
                    ]
                }
            )

            response = extract_agent_content(
                result
            )

            if not response:
                raise ValueError(
                    f"The {agent_name} agent returned no response."
                )

            logger.info(
                "%s agent returned: %s",
                agent_name,
                response[:200],
            )

            # Also print which agent provided the final answer
            print(f"Agent used to answer: {agent_name}")

            return result

        except Exception:
            logger.exception(
                "Supervisor failed while processing the request."
            )

            return create_assistant_result(
                "I could not process that request. Please try again."
            )

    async def _route_with_model(
        self,
        *,
        user_text: str,
    ) -> tuple[AgentName, str]:
        """Ask the supervisor LLM to select a specialist."""

        system_prompt = """
You are the routing supervisor for NeuroChat.

Your only responsibility is to analyze the user's request and choose
the most appropriate specialist agent.

Available agents:

coding:
Use for programming, debugging, software architecture, APIs,
databases, frameworks, testing, deployments, code reviews,
technical errors, and software implementation.

planning:
Use for roadmaps, implementation plans, project decomposition,
strategies, schedules, milestones, priorities, and multi-step tasks.

research:
Use when answering accurately requires searching the live web,
checking external sources, or verifying information that may have
changed. Use it for current events, public officials, company
leadership, prices, weather, sports, laws, schedules, releases,
software versions, product availability, recent information, or
anything whose accuracy depends on current external sources.

chat:
Use for ordinary conversation, timeless explanations, tutoring,
writing assistance, brainstorming, and questions that can be
answered without live external information.

Important rules:

- Decide from the meaning of the user's request.
- Do not answer the user's question yourself.
- Do not add factual information.
- Do not rewrite the request unnecessarily.
- Preserve all important details in the task.
- Choose only one agent.
- When current verification or web information is needed, choose research.
- When uncertain whether information may have changed, choose research.

Return only valid JSON:

{
  "tool": "coding | planning | research | chat",
  "task": "complete request to send to the selected agent"
}

Do not return Markdown.
Do not use a code block.
Do not include explanations outside the JSON.
""".strip()

        router_result = await self.router_model.ainvoke(
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

        decision_text = extract_message_content(
            router_result
        )

        return parse_route_decision(
            decision_text=decision_text,
            fallback_task=user_text,
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
    chat_model_url: str | None = None,
    agent_model: str,
    agent_provider: str,
    agent_api_key: str,
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


def parse_route_decision(
    *,
    decision_text: str,
    fallback_task: str,
) -> tuple[AgentName, str]:
    """Parse and validate the supervisor model response."""

    cleaned_text = remove_markdown_code_fence(
        decision_text
    )

    try:
        parsed = json.loads(cleaned_text)
    except json.JSONDecodeError:
        logger.warning(
            "Supervisor returned invalid JSON: %r",
            decision_text,
        )

        return "chat", fallback_task

    if not isinstance(parsed, dict):
        logger.warning(
            "Supervisor response was not a JSON object: %r",
            parsed,
        )

        return "chat", fallback_task

    raw_agent_name = str(
        parsed.get("tool", "chat")
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

    normalized_agent = aliases.get(
        raw_agent_name
    )

    allowed_agents = {
        "coding",
        "planning",
        "research",
        "chat",
    }

    if normalized_agent is None:
        if raw_agent_name in allowed_agents:
            normalized_agent = cast(
                AgentName,
                raw_agent_name,
            )
        else:
            logger.warning(
                "Supervisor returned unsupported agent: %r",
                raw_agent_name,
            )

            normalized_agent = "chat"

    task = parsed.get("task")

    if not isinstance(task, str) or not task.strip():
        task = fallback_task

    return normalized_agent, task.strip()


def remove_markdown_code_fence(
    text: str,
) -> str:
    """Remove Markdown fences around a JSON response."""

    cleaned = text.strip()

    if not cleaned.startswith("```"):
        return cleaned

    cleaned = re.sub(
        r"^```(?:json)?\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    cleaned = re.sub(
        r"\s*```$",
        "",
        cleaned,
    )

    return cleaned.strip()


def get_latest_user_text(
    messages: list[Any],
) -> str:
    """Extract the latest user message."""

    for message in reversed(messages):
        if isinstance(message, dict):
            role = message.get("role")

            if role in {
                "user",
                "human",
            }:
                return stringify_content(
                    message.get("content")
                )

            continue

        message_type = getattr(
            message,
            "type",
            None,
        )

        if message_type in {
            "human",
            "user",
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

    if isinstance(last_message, dict):
        return stringify_content(
            last_message.get("content")
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
    """Extract final response text from an agent result."""

    if result is None:
        return ""

    if isinstance(result, dict):
        messages = result.get("messages")

        if isinstance(messages, list) and messages:
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
                return stringify_content(value)

    return extract_message_content(result)


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
                return stringify_content(value)

        return str(message)

    content = getattr(
        message,
        "content",
        None,
    )

    if content is not None:
        return stringify_content(content)

    text = getattr(
        message,
        "text",
        None,
    )

    if text is not None:
        return stringify_content(text)

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
                text_parts.append(block)
                continue

            if not isinstance(block, dict):
                continue

            text = block.get("text")

            if isinstance(text, str):
                text_parts.append(text)

        return "\n".join(text_parts).strip()

    return str(content).strip()


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