import os
from typing import Literal

from langchain_core.messages import HumanMessage
from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from langchain_core.runnables.config import RunnableConfig
from pydantic import BaseModel, Field

from agent.state import AgentState
from agent.prompts.supervisor import SUPERVISOR_SYSTEM_PROMPT


class SupervisorDecision(BaseModel):
    """Structured routing decision produced by the supervisor LLM."""

    route: Literal["builder", "learning"] = Field(
        description="Which downstream agent should handle the request next."
    )


def _fallback_route(state: AgentState) -> Literal["builder", "learning"]:
    """Fallback route used when structured LLM routing fails."""
    messages = state.get("messages", [])
    if not messages:
        return "learning"

    last_content = str(messages[-1].content).lower()
    # Keep fallback conservative to avoid hijacking interactive Q&A requests.
    # Route to builder only for explicit resource/file generation intents.
    builder_keywords = [
        "article.md",
        "presentation.json",
        "podcast.json",
        "generate resources",
        "build learning resources",
        "create learning resources",
        "curriculum pack",
        "study package",
    ]
    if any(keyword in last_content for keyword in builder_keywords):
        return "builder"
    return "learning"


def supervisor_node(state: AgentState, config: RunnableConfig):
    llm = ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0,
        top_p=1.0,
    )

    messages = state.get("messages", [])
    latest_user_message = next(
        (
            msg
            for msg in reversed(messages)
            if isinstance(msg, HumanMessage)
        ),
        None,
    )

    routing_messages = (
        [latest_user_message] if latest_user_message is not None else messages
    )

    llm_with_schema = llm.with_structured_output(SupervisorDecision)

    try:
        decision = llm_with_schema.invoke(
            [SystemMessage(content=SUPERVISOR_SYSTEM_PROMPT)] + routing_messages,
            config=config,
        )
        route = decision.route
    except Exception:
        route = _fallback_route(state)

    return {
        "current_agent": route,
    }
    
