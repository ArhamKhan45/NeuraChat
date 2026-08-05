"""NeuroChat planning specialist."""

from app.agents.common import build_agent


def planning_agent(
    model: str,
    provider: str,
    api_key: str,
    model_url: str | None = None,
):
    """Create the planning specialist agent."""

    return build_agent(
        model=model,
        provider=provider,
        api_key=api_key,
        model_url=model_url,
        system_prompt=(
            "You are NeuroChat's expert planning assistant. "
            "Break complex goals into clear, practical, actionable steps. "
            "Identify dependencies, risks, priorities, and milestones. "
            "Do not invent requirements or facts that the user did not provide. "
            "State assumptions clearly. "
            "If necessary information is missing, create the best reasonable "
            "plan while marking the assumptions."
        ),
        tools=[],
    )