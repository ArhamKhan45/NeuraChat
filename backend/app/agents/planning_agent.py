from langgraph.graph.state import CompiledStateGraph

from app.agents.common import build_agent


def planning_agent(
    model: str,
    provider: str,
    api_key: str,
) -> CompiledStateGraph:
    return build_agent(
        model=model,
        provider=provider,
        api_key=api_key,
        system_prompt=(
            "You are an expert planning assistant. "
            "Break complex tasks into clear actionable steps."
        ),
        tools=[],
    )