# Getting Started

Welcome to Arcgentic! This guide will help you set up the project locally for development or demonstration purposes.

## Prerequisites

Ensure you have the following installed on your system:

- **Node.js** (v18 or higher)
- **pnpm** (v10 or higher) - We use pnpm workspaces.
- **Python** (v3.11 or higher)
- **Go** (v1.21 or higher)
- **Docker Desktop** (or any Docker engine) - Required for running the local PostgreSQL database and containerized deployments.
- **Make** - Standard build automation tool for running setup scripts.

## Quick Launch (Docker Compose)

The fastest way to get the full platform running. One command handles everything:

1. **Clone the repository**
   ```bash
   git clone https://github.com/smithg09/arcgentic.git
   cd arcgentic
   ```

2. **Start the platform**
   ```bash
   make start
   ```

   This will:
   - Install all dependencies via pnpm
   - Launch all services (web, user-service, agent-service, database) via Docker Compose
   - Run database migrations
   - Scaffold default `.env` files

3. **Configure an LLM provider**
   Open `apps/agent_service/.env` and add an API key for your preferred provider:
   ```env
   OPENAI_API_KEY=sk-your-openai-key-here
   # or
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
   ```
   
   Then restart the agent service to pick up the new key:
   ```bash
   docker compose restart agent_service
   ```

The application is now running:
- **Web App**: [http://localhost:5173](http://localhost:5173)
- **Go GraphQL API**: [http://localhost:8080](http://localhost:8080)
- **Python Agent API**: [http://localhost:5001](http://localhost:5001)

## Local Development (Hot Reloading)

For active development with live code reloading, use the local dev flow instead:

1. **Set up the local environment**
   ```bash
   make setup-local
   ```
   This installs dependencies, starts only the PostgreSQL database, runs migrations, and scaffolds `.env` files.

2. **Configure an LLM provider**
   Edit `apps/agent_service/.env` and add at least one API key (see Quick Launch step 3 above).

3. **Start all services with hot reload**
   ```bash
   make dev
   ```

- **Web App**: [http://localhost:5173](http://localhost:5173)
- **Go GraphQL API**: [http://localhost:8080](http://localhost:8080)
- **Python Agent API**: [http://localhost:5001](http://localhost:5001)

## Database Management

We use `sqlc` for the Go service and standard PostgreSQL migrations. Common database commands:

- `make db-up` - Start the Postgres container.
- `make db-down` - Stop the Postgres container.
- `make migrate-up` - Apply pending database migrations.
- `make migrate-down` - Rollback the last applied migration.

## Troubleshooting

- **Agent Service fails to start / No event loop error**: Ensure Python 3.11+ is installed and your virtual environment is clean. Run `pip install -r apps/agent_service/requirements.txt` manually if needed.
- **GraphQL errors**: Ensure you have run `make migrate-up` at least once so the `sessions` and `messages` tables exist.
- **UI doesn't update**: Double check that `pnpm dev` successfully built `@arcgentic/ui` (visible in turbo logs).
