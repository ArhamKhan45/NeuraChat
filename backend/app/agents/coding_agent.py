from langgraph.graph.state import CompiledStateGraph

from app.agents.common import build_agent


def coding_agent(
    model: str,
    provider: str,
    api_key: str,
) -> CompiledStateGraph:
    return build_agent(
        model=model,
        provider=provider,
        api_key=api_key,
        system_prompt=(
            "You are an expert software engineer. "
            "Write production-quality code, explain it clearly, "
            "and help debug applications."
        ),
        tools=[],
    )