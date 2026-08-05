"""NeuroChat coding specialist."""

from app.agents.common import build_agent


def coding_agent(
    model: str,
    provider: str,
    api_key: str,
    model_url: str | None = None,
):
    """Create the coding specialist agent."""

    return build_agent(
        model=model,
        provider=provider,
        api_key=api_key,
        model_url=model_url,
        system_prompt=(
            "You are NeuroChat's expert software engineering agent. "
            "Handle programming, debugging, APIs, databases, architecture, "
            "testing, deployment, frameworks, and production systems. "
            "Write complete, production-quality code when requested. "
            "Explain important decisions clearly. "
            "Do not invent imports, APIs, libraries, or system details. "
            "If information is uncertain, say so."
        ),
        tools=[],
    )