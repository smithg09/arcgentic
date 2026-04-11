<div align="center">
  <h3><b>Arcgentic</b></h3>
  <h4 style="margin-top: -10px;">Ask, Learn, Master.</h4>
  
  <p>An open-source, multi-agent learning platform where AI agents research, teach, and create personalized learning content for any topic.</p>
</div>

---

<!-- [Demo Video / Image Placeholder - To be added] -->
<div align="center">
  <em>[Demo video or SVG placeholder]</em>
</div>

---

## 🎯 What is Arcgentic?

Arcgentic is a comprehensive AI-powered learning environment designed to transform how you study and explore new topics. By leveraging multi-agent orchestration, the platform builds an adaptive curriculum specifically for you.

### How it Works

- **Ask anything** — Start a learning session on any topic from scratch, or provide your own study materials (PDFs, URLs) for the agents to analyze.
- **Learn interactively** — Engage with a dedicated tutor agent that guides you step-by-step. The chat experience is enhanced with inline visualizations, dynamic diagrams, and interactive widgets.
- **Master the material** — Unlike standard chatbot interfaces, Arcgentic automatically generates a complete asset pack to help you master the material:
  - Deep-dive explanations
  - Interactive concept roadmaps
  - Presentation slides
  - Podcast scripts
  - Spaced-repetition flashcards

### 📦 Generated Learning Content

Arcgentic acts as your personal curriculum factory. Once it understands what you are trying to learn, our multi-agent workflow autonomously researches and synthesizes a complete, structured study-pack:
- **Deep-Dive Explanations**: Long-form, beautifully formatted reading materials.
- **Roadmaps**: Interactive diagrams showing how topics interconnect.
- **Audio Podcasts**: Generated dialog-style podcasts exploring the subject matter.
- **Slide Decks**: Ready-to-read presentations summarizing key takeaways.
- **Flashcard Sets**: Spaced-repetition cards designed for active recall.

### 🎨 Interactive "Artifact" Chat

Drawing inspiration from systems like Claude's Artifacts, your Arcgentic Tutor doesn't just reply with simple text. During a session, the tutoring agent will actively generate and render living UI components directly in your chat stream. When explaining complex ideas, the agent can auto-generate:
- Custom SVG illustrations
- Dynamic data visualizations and charts
- Mermaid-based architectural diagrams and flowcharts
- Interactive learning widgets

## 🚀 Quick Start

Get Arcgentic up and running locally with just a few commands. This builds and launches the full platform (UI, APIs, and Database) via Docker.

### Prerequisites
Make sure you have installed on your machine:
- Node.js ≥ 18 & pnpm ≥ 10
- Python ≥ 3.11
- Go ≥ 1.21
- Docker Desktop (or another Docker engine)

### Setup & Launch

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd arcgentic
   ```

2. **Automated Setup**
   Run the initial setup to install dependencies, boot the database, run migrations, and scaffold `.env` files.
   ```bash
   make setup
   ```

3. **Start the Platform**
   Bring up the complete application stack using Docker Compose:
   ```bash
   docker compose up -d
   ```

The application is now running locally!
- **Web UI**: [http://localhost:5173](http://localhost:5173) (Open this in your browser)
- Agent API: http://localhost:5001
- User/GraphQL API: http://localhost:8080

---

## 📚 Documentation

For developers, contributors, and those looking to run services outside of Docker, please refer to our dedicated documentation guides:

- **[Getting Started / Local Dev](docs/getting-started.md)** — Detailed setup instructions, hot-reloading configurations, and troubleshooting tips.
- **[Architecture Overview](docs/architecture.md)** — Deep dive into the monorepo structure, multi-agent LangGraph flows, and tech stack details.
- **[Contributing](docs/contributing.md)** — Pull request guidelines, code of conduct, and development standards.
