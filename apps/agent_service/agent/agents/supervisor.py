import os
from typing import Literal

from langchain_core.messages import HumanMessage
from langchain_core.messages import SystemMessage
from langchain_core.runnables.config import RunnableConfig
from pydantic import BaseModel, Field

from agent.state import AgentState, AgentTask
from agent.prompts.supervisor import SUPERVISOR_SYSTEM_PROMPT
from agent.model_provider import get_chat_model, ModelConfig


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
        "explanation.md",
        "presentation.json",
        "podcast.json",
        "flashcards.json",
        "roadmap.json",
        "generate resources",
        "build learning resources",
        "create learning resources",
        "curriculum pack",
        "study package",
        "update the explanation",
        "update the presentation",
        "update the podcast",
        "update the flashcards",
        "update the roadmap",
        "regenerate the explanation",
        "regenerate the presentation",
        "regenerate the podcast",
        "regenerate the flashcards",
        "regenerate the roadmap",
        "change the podcast",
        "change the explanation",
        "rebuild the roadmap",
        "add more flashcards",
    ]
    if any(keyword in last_lower for keyword in builder_keywords):
        return [AgentTask(agent="builder", user_request=last_content)]
    return [AgentTask(agent="learning", user_request=last_content)]


async def supervisor_node(state: AgentState, config: RunnableConfig):
    model_cfg = state.get("model_config")
    llm = get_chat_model(
        ModelConfig(**model_cfg) if model_cfg else None,
        defaults={"temperature": 0, "top_p": 1.0},
    )

    messages = state.get("messages", [])

    llm_with_schema = llm.with_structured_output(SupervisorDecision)

    try:
        decision = await llm_with_schema.ainvoke(
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
