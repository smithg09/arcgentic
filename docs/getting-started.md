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

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/arcgentic.git
   cd arcgentic
   ```

2. **Automated Setup**
   We provide a Makefile target that handles installing all dependencies, starting the database, running migrations, and setting up initial environment variables.
   
   ```bash
   make setup
   ```
   *Note: This runs `pnpm install` at the root to bootstrap all JS/TS dependencies across the monorepo.*

3. **Configure Environment Variables**
   The `make setup` command created default `.env` files across the various apps. You must at least configure an LLM provider for the agent service to function.
   
   Open `apps/agent_service/.env` and add an API key for your preferred provider, for example:
   ```env
   OPENAI_API_KEY=sk-your-openai-key-here
   # or
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
   ```
   
   By default, the application will fallback to available providers or prompt you in the Web UI Settings if no keys are found.

## Running the Application

### Option A: Local Development (Hot Reloading)

To run the application with hot-reloading across the entire stack, use Turborepo. Ensure your Docker database is running first:

```bash
# Ensure DB is up
make db-up

# Start all services (Web, Agent RPC, Go Server)
pnpm dev
```

- **Web App**: [http://localhost:5173](http://localhost:5173)
- **Go GraphQL API**: [http://localhost:8080](http://localhost:8080)
- **Python Agent API**: [http://localhost:5001](http://localhost:5001)

### Option B: Full Docker Deployment

If you want to run the entire stack exactly as it would run in production:

```bash
docker compose up --build
```
This builds and orchestrates the database, user service, agent service, and frontend. Everything will be accessible via localhost at the same ports mentioned above.

## Database Management

We use `sqlc` for the Go service and standard PostgreSQL migrations. Common database commands:

- `make db-up` - Start the Postgres container.
- `make db-down` - Stop the Postgres container.
- `make migrate-up` - Apply pending database migrations.
- `make migrate-down` - Rollback the last applied migration.
- `make psql` - Drop into a Postgres shell connected to the dev DB.

## Troubleshooting

- **Agent Service fails to start / No event loop error**: Ensure Python 3.11+ is installed and your virtual environment is clean. Run `pip install -r apps/agent_service/requirements.txt` manually if needed.
- **GraphQL errors**: Ensure you have run `make migrate-up` at least once so the `sessions` and `messages` tables exist.
- **UI doesn't update**: Double check that `pnpm dev` successfully built `@arcgentic/ui` (visible in turbo logs).
