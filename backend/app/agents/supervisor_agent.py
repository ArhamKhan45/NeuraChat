"""NeuroChat supervisor agent."""

from typing import Any

from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain.tools import tool
from langgraph.graph.state import CompiledStateGraph

from app.agents.chat_agent import chat_agent
from app.agents.coding_agent import coding_agent
from app.agents.planning_agent import planning_agent
from app.agents.rag_agent import rag_agent
from app.agents.research_agent import research_agent


def supervisor_agent(
    *,
    chat_model: str,
    chat_provider: str,
    chat_api_key: str,
    chat_model_url: str | None,
    agent_model: str,
    agent_provider: str,
    agent_api_key: str,
    agent_model_url: str | None,
) -> CompiledStateGraph:
    """Create the supervisor with specialist agents as tools."""

    supervisor_llm = create_model(
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

    rag = rag_agent(
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

    @tool
    async def use_coding_agent(task: str) -> str:
        """Handle programming, debugging, APIs, and architecture."""

        result = await coding.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": task,
                    }
                ]
            }
        )

        return extract_agent_content(result)

    @tool
    async def use_planning_agent(task: str) -> str:
        """Handle roadmaps, plans, and task decomposition."""

        result = await planning.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": task,
                    }
                ]
            }
        )

        return extract_agent_content(result)

    @tool
    async def use_research_agent(task: str) -> str:
        """Handle research, investigation, and comparisons."""

        result = await research.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": task,
                    }
                ]
            }
        )

        return extract_agent_content(result)

    @tool
    async def use_rag_agent(task: str) -> str:
        """Answer questions using retrieved user documents."""

        result = await rag.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": task,
                    }
                ]
            }
        )

        return extract_agent_content(result)

    @tool
    async def use_chat_agent(task: str) -> str:
        """Handle ordinary conversation and general questions."""

        result = await general_chat.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": task,
                    }
                ]
            }
        )

        return extract_agent_content(result)

    return create_agent(
        model=supervisor_llm,
        tools=[
            use_coding_agent,
            use_planning_agent,
            use_research_agent,
            use_rag_agent,
            use_chat_agent,
        ],
        system_prompt=(
            "You are the NeuroChat supervisor. "
            "Analyze every user request and delegate it to the most "
            "appropriate specialist tool. "
            "Use the coding agent for software tasks, planning agent "
            "for plans, research agent for investigation, RAG agent "
            "for document-grounded requests, and chat agent for general "
            "conversation. Return one clear final response."
        ),
    )


def create_model(
    *,
    model: str,
    provider: str,
    api_key: str,
    model_url: str | None,
):
    """Initialize one configured LangChain chat model."""

    model_arguments: dict[str, Any] = {
        "model": model,
        "model_provider": provider,
        "api_key": api_key,
    }

    if model_url:
        model_arguments["base_url"] = model_url

    return init_chat_model(**model_arguments)


def extract_agent_content(
    result: dict[str, Any],
) -> str:
    """Extract the last response from a specialist agent."""

    messages = result.get("messages", [])

    if not messages:
        return "The specialist agent returned no response."

    return str(messages[-1].content)