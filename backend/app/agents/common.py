from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langgraph.graph.state import CompiledStateGraph


def build_agent(
    *,
    model: str,
    provider: str,
    api_key: str,
    system_prompt: str,
    tools: list,
) -> CompiledStateGraph:
    """Create a LangChain agent."""

    llm = init_chat_model(
        model=model,
        model_provider=provider,
        api_key=api_key,
    )

    return create_agent(
        model=llm,
        tools=tools,
        system_prompt=system_prompt,
    )