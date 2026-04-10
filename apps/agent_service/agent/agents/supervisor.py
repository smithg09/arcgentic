import os
from typing import Literal

from langchain_core.messages import HumanMessage
from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from langchain_core.runnables.config import RunnableConfig
from pydantic import BaseModel, Field

from agent.state import AgentState, AgentTask
from agent.prompts.supervisor import SUPERVISOR_SYSTEM_PROMPT


class SupervisorDecision(BaseModel):
    """Structured routing decision produced by the supervisor LLM.

    Supports multi-intent: the LLM outputs an ordered list of agent tasks,
    each with a specific sub-request extracted from the user's message.
    """

    tasks: list[AgentTask] = Field(
        description=(
            "Ordered list of agent tasks to execute. Each task specifies "
            "which agent to use and the extracted user sub-request for it."
        ),
    )


def _fallback_queue(state: AgentState) -> list[AgentTask]:
    """Fallback queue used when structured LLM routing fails."""
    messages = state.get("messages", [])
    if not messages:
        return [AgentTask(agent="learning", user_request="")]

    last_content = str(messages[-1].content)
    last_lower = last_content.lower()

    builder_keywords = [
        "article.md",
        "presentation.json",
        "podcast.json",
        "generate resources",
        "build learning resources",
        "create learning resources",
        "curriculum pack",
        "study package",
        "update the article",
        "update the presentation",
        "update the podcast",
        "regenerate the article",
        "regenerate the presentation",
        "regenerate the podcast",
        "change the podcast",
        "change the article",
    ]
    if any(keyword in last_lower for keyword in builder_keywords):
        return [AgentTask(agent="builder", user_request=last_content)]
    return [AgentTask(agent="learning", user_request=last_content)]


def supervisor_node(state: AgentState, config: RunnableConfig):
    llm = ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0,
        top_p=1.0,
    )

    messages = state.get("messages", [])
    # latest_user_message = next(
    #     (
    #         msg
    #         for msg in reversed(messages)
    #         if isinstance(msg, HumanMessage)
    #     ),
    #     None,
    # )

    llm_with_schema = llm.with_structured_output(SupervisorDecision)

    try:
        decision = llm_with_schema.invoke(
            [SystemMessage(content=SUPERVISOR_SYSTEM_PROMPT)] + messages,
            config=config,
        )
        queue = decision.tasks
        # Ensure every task has a valid agent
        queue = [t for t in queue if t.agent in {"builder", "learning"}]
        if not queue:
            queue = _fallback_queue(state)
    except Exception:
        queue = _fallback_queue(state)

    return {
        "agent_queue": queue,
        "current_agent": queue[0].agent if queue else "learning",
    }
