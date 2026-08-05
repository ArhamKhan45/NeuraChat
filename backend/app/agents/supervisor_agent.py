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
import logging


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
    )

    planning = planning_agent(
        model=agent_model,
        provider=agent_provider,
        api_key=agent_api_key,
    )

    research = research_agent(
        model=agent_model,
        provider=agent_provider,
        api_key=agent_api_key,
    )

    rag = rag_agent(
        model=agent_model,
        provider=agent_provider,
        api_key=agent_api_key,
    )

    general_chat = chat_agent(
        model=agent_model,
        provider=agent_provider,
        api_key=agent_api_key,
    )

    @tool
    async def use_coding_agent(task: str) -> str:
        """Handle programming, debugging, APIs, and architecture."""

        try:
            result = await coding.ainvoke({"messages": [{"role": "user", "content": task}]})
            return extract_agent_content(result)
        except Exception as error:
            logging.exception("use_coding_agent failed: %s", error)
            return f"Error calling coding agent: {error}"

    @tool
    async def use_planning_agent(task: str) -> str:
        """Handle roadmaps, plans, and task decomposition."""

        try:
            result = await planning.ainvoke({"messages": [{"role": "user", "content": task}]})
            return extract_agent_content(result)
        except Exception as error:
            logging.exception("use_planning_agent failed: %s", error)
            return f"Error calling planning agent: {error}"

    @tool
    async def use_research_agent(task: str) -> str:
        """Handle research, investigation, and comparisons."""

        try:
            result = await research.ainvoke({"messages": [{"role": "user", "content": task}]})
            return extract_agent_content(result)
        except Exception as error:
            logging.exception("use_research_agent failed: %s", error)
            return f"Error calling research agent: {error}"

    @tool
    async def use_rag_agent(task: str) -> str:
        """Answer questions using retrieved user documents."""

        try:
            result = await rag.ainvoke({"messages": [{"role": "user", "content": task}]})
            return extract_agent_content(result)
        except Exception as error:
            logging.exception("use_rag_agent failed: %s", error)
            return f"Error calling RAG agent: {error}"

    @tool
    async def use_chat_agent(task: str) -> str:
        """Handle ordinary conversation and general questions."""

        try:
            result = await general_chat.ainvoke({"messages": [{"role": "user", "content": task}]})
            return extract_agent_content(result)
        except Exception as error:
            logging.exception("use_chat_agent failed: %s", error)
            return f"Error calling chat agent: {error}"

    # Instead of using function-calling tools (which some providers reject),
    # create a small wrapper that uses the supervisor LLM to choose a tool
    # and dispatches to the specialist agents directly.

    class SupervisorWrapper:
        def __init__(
            self,
            llm,
            coding,
            planning,
            research,
            rag,
            general_chat,
            system_prompt,
        ):
            self.llm = llm
            self.coding = coding
            self.planning = planning
            self.research = research
            self.rag = rag
            self.general_chat = general_chat
            self.system_prompt = system_prompt

        async def ainvoke(self, input: dict[str, Any]) -> dict[str, Any]:
            messages = input.get("messages", [])

            # Extract the user's latest message
            user_text = ""
            if messages:
                last = messages[-1]
                user_text = last.get("content") if isinstance(last, dict) else getattr(last, "content", "")

            # Ask the supervisor model to pick a tool and return a JSON object
            prompt = (
                f"{self.system_prompt}\n\n"
                "Respond with a JSON object containing two keys: 'tool' and 'task'.\n"
                "'tool' must be one of: coding, planning, research, rag, chat.\n"
                "'task' should be the content to send to that tool.\n"
                f"User message: {user_text}"
            )

            # Call the LLM with a list of messages (chat models expect a list)
            llm_result = await self.llm.ainvoke([
                {"role": "user", "content": prompt}
            ])

            # Extract text from llm_result robustly across possible return shapes
            def _extract_text(res: Any) -> str:
                try:
                    if res is None:
                        return ""

                    # dict-like with messages
                    if isinstance(res, dict):
                        if "messages" in res:
                            msgs = res.get("messages") or []
                            if msgs:
                                last = msgs[-1]
                                if isinstance(last, dict):
                                    return last.get("content") or last.get("text") or str(last)
                                return str(last)
                        # direct content fields
                        for key in ("content", "text", "message"):
                            if key in res and res[key]:
                                return res[key]
                        # generations-like structures
                        gen = res.get("generations") or res.get("generation")
                        if gen and isinstance(gen, list) and gen[0]:
                            first = gen[0]
                            if isinstance(first, dict):
                                return first.get("text") or str(first)

                    # list-like
                    if isinstance(res, list):
                        last = res[-1]
                        if isinstance(last, dict):
                            return last.get("content") or last.get("text") or str(last)
                        return str(last)

                    # objects with attributes
                    if hasattr(res, "generations"):
                        gens = getattr(res, "generations")
                        if isinstance(gens, list) and gens:
                            g0 = gens[0]
                            if isinstance(g0, list) and g0:
                                item = g0[0]
                                return getattr(item, "text", str(item))
                    if hasattr(res, "text"):
                        return getattr(res, "text")

                    return str(res)
                except Exception:
                    logging.exception("Failed to parse model result for decision: %r", res)
                    return ""

            decision_text = _extract_text(llm_result)

            if not decision_text:
                logging.exception("Failed to extract decision from supervisor LLM: %r", llm_result)
                return {"messages": [{"role": "assistant", "content": "Supervisor failed to produce a decision."}]}

            # Parse JSON decision
            import json

            tool_name = None
            task_text = None

            try:
                parsed = json.loads(decision_text)
                tool_name = parsed.get("tool")
                task_text = parsed.get("task")
            except Exception:
                # Fallback: try simple parsing
                for line in decision_text.splitlines():
                    if "tool" in line.lower():
                        parts = line.split(":", 1)
                        if len(parts) == 2:
                            tool_name = parts[1].strip()
                    if "task" in line.lower():
                        parts = line.split(":", 1)
                        if len(parts) == 2:
                            task_text = parts[1].strip()

            if not tool_name:
                tool_name = "chat"

            if not task_text:
                task_text = user_text

            # Select the agent
            agent_map = {
                "coding": self.coding,
                "planning": self.planning,
                "research": self.research,
                "rag": self.rag,
                "chat": self.general_chat,
            }

            agent = agent_map.get(tool_name.lower(), self.general_chat)

            # Log which agent was selected for debugging/testing
            logging.info("Supervisor selected agent: %s", tool_name)
            print(f"Supervisor selected agent: {tool_name}")

            try:
                result = await agent.ainvoke({"messages": [{"role": "user", "content": task_text}]})

                # Log a short snippet of the agent's response to the console
                try:
                    snippet = extract_agent_content(result)
                    if isinstance(snippet, str):
                        logging.info("Agent %s returned (snippet): %s", tool_name, snippet[:200])
                        print(f"Agent {tool_name} returned (snippet): {snippet[:200]}")
                    else:
                        logging.info("Agent %s returned non-str response", tool_name)
                except Exception:
                    logging.exception("Failed to extract snippet from agent %s result", tool_name)

                return result
            except Exception as error:
                logging.exception("Error invoking specialist agent %s: %s", tool_name, error)
                return {"messages": [{"role": "assistant", "content": f"Error invoking {tool_name} agent: {error}"}]}

    return SupervisorWrapper(
        supervisor_llm,
        coding,
        planning,
        research,
        rag,
        general_chat,
        (
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
    messages = result.get("messages", []) if isinstance(result, dict) else []

    if not messages and not result:
        return "The specialist agent returned no response."

    last = None

    if messages:
        last = messages[-1]
    else:
        # Fall back to trying the result itself
        last = result

    # Support both dict-like and object-like message shapes
    try:
        if isinstance(last, dict):
            content = last.get("content") or last.get("text") or last.get("message")
        else:
            content = getattr(last, "content", None) or getattr(last, "text", None) or str(last)

        if content is None:
            return "The specialist agent returned no response."

        return str(content)
    except Exception:
        logging.exception("Failed to extract agent content from result: %r", result)
        return str(result)