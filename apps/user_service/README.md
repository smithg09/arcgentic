# Arcgentic User Service (Go Backend)

GraphQL backend for Arcgentic user and learning-progression data.

This service manages:

- users
- learning sessions
- earned skills

## Architecture

```
apps/user_service/
├── cmd/core/
│   ├── graph/                     # gqlgen generated resolvers and models
│   ├── gqlgen.yml
│   └── main.go                    # Application entrypoint (Echo + GraphQL)
├── db/migration/                  # SQL migrations
├── internal/
│   ├── actor/
│   │   ├── db/sql/                # Postgres adapter
│   │   └── server/                # Echo server wrapper
│   ├── module/
│   │   ├── user/
│   │   │   └── user-querier/
│   │   ├── session/
│   │   │   └── session-querier/
│   │   └── earnedskill/
│   │       └── earnedskill-querier/
│   └── util/                      # Config, filters, GraphQL base schema, logger
├── go.mod
└── package.json
```

All build and development commands are orchestrated from the root Makefile.

## API Surface (GraphQL)

### Queries

- ping: String
- getUser(id: Uuid!): User
- getSession(id: Uuid!): Session
- listSessions(where: WhereSessionsDto): [Session!]!
- getEarnedSkills(user_id: Uuid!): EarnedSkills

### Mutations

- createUser(data: CreateUserDto!): User
- updateUser(id: Uuid!, data: UpdateUserDto!): User
- deleteUser(id: Uuid!): Boolean
- createSession(data: CreateSessionDto!): Session
- updateSession(id: Uuid!, data: UpdateSessionDto!): Session
- upsertEarnedSkills(data: UpsertEarnedSkillsDto!): EarnedSkills

## Runtime Endpoints

- GraphQL Playground: http://localhost:8080/
- GraphQL API: http://localhost:8080/query

## Environment Variables

Copy .env.example to .env in this service:

```bash
cd apps/user_service
cp .env.example .env
```

Current defaults:

```bash
# Application
ENVIRONMENT=development
LOG_LEVEL=debug

# Postgres
POSTGRES_URI=postgresql://aiproject:aiproject@localhost:5433
POSTGRES_DATABASE=aiproject
POSTGRES_IS_SSL_DISABLED=true
```

## Development

### Start Dependencies

From project root:

```bash
make db-up
make migrate-up
```

### Run Backend (Hot Reload)

From project root:

```bash
make dev-backend
```

Or directly in this service:

```bash
cd apps/user_service
pnpm dev
```

## Code Generation

After updating GraphQL schema files:

```bash
make gqlgen
```

### Generate SQLC Queries

After modifying SQL queries in `internal/module/*/sql/`:

```bash
make sqlc
```

### Database Migrations

All migration commands should be run from the **root directory**:

```bash
# Apply all pending migrations
make migrate-up

# Rollback last migration
make migrate-down

# Jump to specific version
make version=3 migrate-goto

# Force version (use with caution)
make version=3 migrate-force

# Check current version
make migrate-version
```

### Testing

```bash
make test-backend
```

Run tests directly in this service:

```bash
make gqlgen
```

### 3. Implement Resolvers

Edit generated files in `cmd/core/graph/`

### 4. Add Database Layer

- Create migration: `db/migration/XXXXXX_your_feature.up.sql`
- Add SQLC queries: `internal/module/yourmodule/sql/`
- Generate: `make sqlc`

## Build

From project root:

```bash
make build-backend
```

Binary output:

```text
apps/user_service/build/core
```

## Migrations

From project root:

```bash
make migrate-up
make migrate-down
make version=3 migrate-goto
make version=3 migrate-force
make migrate-version
```

## Troubleshooting

GraphQL generation fails:

- Validate all schema.graphql files.
- Check apps/user_service/cmd/core/gqlgen.yml.

Database connection errors:

- Verify Postgres container is running.
- Verify apps/user_service/.env values match docker-compose settings.

Migration errors:

- Check SQL syntax in apps/user_service/db/migration.
- Check current migration state with make migrate-version.

Air not found:

- Install Air: go install github.com/cosmtrek/air@latest
- Or run: go run cmd/core/main.go
