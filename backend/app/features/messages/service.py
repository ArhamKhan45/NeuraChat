"""Services for generating assistant responses."""


async def generate_assistant_reply(
    message: str,
) -> str:
    """
    Generate an assistant response.

    Replace this temporary implementation with the LangGraph
    or LLM invocation used by NeuroChat.
    """

    return (
        "NeuroChat received your message: "
        f"{message}"
    )