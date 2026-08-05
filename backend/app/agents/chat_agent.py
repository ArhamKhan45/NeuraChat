"""NeuroChat general conversation agent."""

from app.agents.common import build_agent


def chat_agent(
    model: str,
    provider: str,
    api_key: str,
    model_url: str | None = None,
):
    """Create the general conversation agent."""

    return build_agent(
        model=model,
        provider=provider,
        api_key=api_key,
        model_url=model_url,
        system_prompt=(
            "You are NeuroChat's general conversation assistant. "
            "Answer clearly, naturally, and directly. "
            "Use the research agent only through the supervisor for "
            "questions requiring current or live information. "
            "If you do not know an answer, say so. "
            "Do not invent facts or fabricate details."
        ),
        tools=[],
    )