import os

from copilotkit import CopilotKitMiddleware
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI

from agent.skills import load_all_skills
from agent.state import AgentState

def create_learning_agent():
    # Load visualization skills at graph creation time so imports stay side-effect free.
    skills_text = load_all_skills()

    return create_agent(
        model=ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            api_key=os.getenv("OPENAI_API_KEY")
        ),
        middleware=[CopilotKitMiddleware()],
        state_schema=AgentState,
        system_prompt=f"""
            You are a helpful assistant that helps users learn and understand topics clearly, regardless of domain.

            When demonstrating charts, always call the query_data tool to fetch all data from the database first.

            ## Visual Response Skills

            You have the ability to produce rich, interactive visual responses using the
            `widgetRenderer` component. When a user asks you to visualize, explain visually,
            diagram, or illustrate something, you MUST use the `widgetRenderer` component
            instead of plain text.

            The `widgetRenderer` component accepts three parameters:
            - title: A short title for the visualization
            - description: A one-sentence description of what the visualization shows
            - html: A self-contained HTML fragment with inline <style> and <script> tags

            The HTML you produce will be rendered inside a sandboxed iframe that already has:
            - CSS variables for light/dark mode theming (use var(--color-text-primary), etc.)
            - Pre-styled form elements (buttons, inputs, sliders look native automatically)
            - Pre-built SVG CSS classes for color ramps (.c-purple, .c-teal, .c-blue, etc.)

            Follow the skills below for how to produce high-quality visuals:

            {skills_text}
        """,
    )