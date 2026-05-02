# Arcgentic User Service

GraphQL backend for user management, learning sessions, and skill progression.

## Architecture

Built with Go, Echo, and gqlgen, backed by PostgreSQL with SQLC-generated queries.

```
apps/user_service/
├── cmd/core/
│   ├── graph/              # gqlgen generated resolvers and models
│   ├── gqlgen.yml
│   └── main.go             # Application entrypoint
├── db/migration/           # SQL migrations (golang-migrate)
├── internal/
│   ├── actor/
│   │   ├── db/sql/         # Postgres adapter
│   │   └── server/         # Echo server wrapper
│   ├── module/
│   │   ├── user/           # User CRUD
│   │   ├── session/        # Learning session CRUD
│   │   └── earnedskill/    # Skill progression tracking
│   └── util/               # Config, filters, GraphQL base schema, logger
├── go.mod
└── package.json
```

## API Surface (GraphQL)

### Queries

| Query | Description |
|-------|-------------|
| `ping` | Health check |
| `getUser(id)` | Get user by ID |
| `getSession(id)` | Get session by ID |
| `listSessions(where)` | List sessions with filters |
| `getEarnedSkills(user_id)` | Get user's earned skills |

### Mutations

| Mutation | Description |
|----------|-------------|
| `createUser(data)` | Create a new user |
| `updateUser(id, data)` | Update user profile |
| `deleteUser(id)` | Delete a user |
| `createSession(data)` | Create a learning session |
| `updateSession(id, data)` | Update session metadata |
| `upsertEarnedSkills(data)` | Add or update earned skills |

## Runtime Endpoints

- **GraphQL Playground**: http://localhost:8080/
- **GraphQL API**: http://localhost:8080/query

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | `development` | Runtime environment |
| `LOG_LEVEL` | `debug` | Log verbosity |
| `POSTGRES_URI` | `postgresql://arcgentic:arcgentic@localhost:5433` | Database host |
| `POSTGRES_DATABASE` | `arcgentic` | Database name |
| `POSTGRES_IS_SSL_DISABLED` | `true` | Disable SSL for local dev |

## Development

### Start the service

From the project root:

```bash
make dev-backend
```

Or directly:

```bash
cd apps/user_service
pnpm dev
```

### Code Generation

```bash
# After updating GraphQL schema files
make gqlgen

# After modifying SQLC query files
make sqlc
```

### Database Migrations

All migration commands from the project root:

```bash
make migrate-up              # Apply all pending migrations
make migrate-down            # Rollback last migration
make version=3 migrate-goto  # Jump to specific version
make version=3 migrate-force # Force version (use with caution)
make migrate-version         # Check current version
```

### Testing

```bash
make test-backend
```

## Build

```bash
make build-backend
# Output: apps/user_service/build/core
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| GraphQL generation fails | Validate all `schema.graphql` files, check `gqlgen.yml` |
| Database connection errors | Verify Postgres container is running, check `.env` values |
| Migration errors | Check SQL syntax in `db/migration/`, run `make migrate-version` |
| Air not found | Install Air: `go install github.com/cosmtrek/air@latest` |
