#!make

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
NC := \033[0m # No Color

.DEFAULT_GOAL := help

# Help command
help:
	@echo "$(BLUE)Available commands:$(NC)"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make dev              - Start all services in development mode"
	@echo "  make dev-backend      - Start Go backend with hot reload"
	@echo "  make dev-frontend     - Start SvelteKit frontend"
	@echo ""
	@echo "$(GREEN)Database:$(NC)"
	@echo "  make db-up            - Start PostgreSQL with Docker"
	@echo "  make db-down          - Stop PostgreSQL"
	@echo "  make db-reset         - Reset database (delete volume)"
	@echo "  make migrate-up       - Run all pending migrations"
	@echo "  make migrate-down     - Rollback last migration"
	@echo "  make migrate-version  - Show current migration version"
	@echo ""
	@echo "$(GREEN)Code Generation:$(NC)"
	@echo "  make gqlgen           - Generate GraphQL code"
	@echo "  make sqlc             - Generate SQLC queries"
	@echo ""
	@echo "$(GREEN)Build & Test:$(NC)"
	@echo "  make build            - Build all services"
	@echo "  make build-backend    - Build Go backend"
	@echo "  make build-frontend   - Build SvelteKit frontend"
	@echo "  make test             - Run all tests"
	@echo "  make test-backend     - Run Go tests with coverage"
	@echo ""
	@echo "$(GREEN)Code Quality:$(NC)"
	@echo "  make lint             - Run linters for all code"
	@echo "  make format           - Format all code"
	@echo "  make check-types      - Type check TypeScript/Svelte"
	@echo ""
	@echo "$(GREEN)Cleanup:$(NC)"
	@echo "  make clean            - Clean build artifacts"
	@echo ""
	@echo "$(GREEN)Setup:$(NC)"
	@echo "  make setup            - First-time project setup"

.PHONY: help

# Variables
BACKEND_DIR := apps/user_service
FRONTEND_DIR := apps/web
NAME := core

# Load environment variables from backend .env
env_file := $(BACKEND_DIR)/.env
ifneq ("$(wildcard $(env_file))","")
	include $(env_file)
endif

# Database connection for migrations
# Note: migrate tool requires 'postgres://' scheme, not 'postgresql://'
POSTGRES_HOST ?= localhost
POSTGRES_PORT ?= 5439
POSTGRES_USER ?= postgres
POSTGRES_PASSWORD ?= supersecretpassword
POSTGRES_DATABASE ?= sveltekit-go-graphql-starter

ifeq ($(POSTGRES_IS_SSL_DISABLED),true)
	ssl_mode := ?sslmode=disable
else
	ssl_mode :=
endif

# Construct migration URI (override if POSTGRES_URI exists in .env)
ifdef POSTGRES_URI
	# Convert postgresql:// to postgres:// if needed
	postgres_uri := $(subst postgresql://,postgres://,$(POSTGRES_URI)/$(POSTGRES_DATABASE)$(ssl_mode))
else
	postgres_uri := postgres://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@$(POSTGRES_HOST):$(POSTGRES_PORT)/$(POSTGRES_DATABASE)$(ssl_mode)
endif

#
# Development Commands
#
dev:
	@echo "$(GREEN)Starting all services...$(NC)"
	@echo "$(BLUE)Checking if PostgreSQL is running...$(NC)"
	@if ! docker ps | grep -q golang-sveltekit-postgres; then \
		echo "$(BLUE)PostgreSQL is not running. Starting it...$(NC)"; \
		make db-up; \
		echo "$(BLUE)Waiting for PostgreSQL to be ready...$(NC)"; \
		sleep 5; \
	else \
		echo "$(BLUE)PostgreSQL is already running$(NC)"; \
	fi
	@pnpm dev

dev-backend:
	@echo "$(GREEN)Starting Go backend...$(NC)"
	@echo "$(BLUE)Checking if PostgreSQL is running...$(NC)"
	@if ! docker ps | grep -q golang-sveltekit-postgres; then \
		echo "$(BLUE)PostgreSQL is not running. Starting it...$(NC)"; \
		make db-up; \
		echo "$(BLUE)Waiting for PostgreSQL to be ready...$(NC)"; \
		sleep 5; \
	else \
		echo "$(BLUE)PostgreSQL is already running$(NC)"; \
	fi
	@pnpm run dev --filter=core

dev-frontend:
	@echo "$(GREEN)Starting SvelteKit frontend...$(NC)"
	@pnpm dev --filter=web

.PHONY: dev dev-backend dev-frontend

#
# Database Commands
#
db-up:
	@echo "$(GREEN)Starting PostgreSQL...$(NC)"
	@docker-compose up -d
	@echo "$(BLUE)PostgreSQL is running on port 5439$(NC)"

db-down:
	@echo "$(GREEN)Stopping PostgreSQL...$(NC)"
	@docker-compose down

db-reset:
	@echo "$(GREEN)Resetting database...$(NC)"
	@docker-compose down -v
	@docker-compose up -d
	@sleep 3
	@make migrate-up

.PHONY: db-up db-down db-reset

#
# Migration Commands
#
migrate-up:
	@echo "$(GREEN)Running migrations...$(NC)"
	@cd $(BACKEND_DIR) && go run -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest \
		-path db/migration -database $(postgres_uri) --verbose up $(version)

migrate-down:
	@echo "$(GREEN)Rolling back migration...$(NC)"
	@cd $(BACKEND_DIR) && go run -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest \
		-path db/migration -database $(postgres_uri) --verbose down 1

migrate-goto:
	@echo "$(GREEN)Migrating to version $(version)...$(NC)"
	@cd $(BACKEND_DIR) && go run -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest \
		-path db/migration -database $(postgres_uri) --verbose goto $(version)

migrate-force:
	@echo "$(GREEN)Forcing migration version $(version)...$(NC)"
	@cd $(BACKEND_DIR) && go run -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest \
		-path db/migration -database $(postgres_uri) --verbose force $(version)

migrate-version:
	@cd $(BACKEND_DIR) && go run -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest \
		-path db/migration -database $(postgres_uri) --verbose version

.PHONY: migrate-up migrate-down migrate-goto migrate-force migrate-version

#
# Code Generation
#
gqlgen:
	@echo "$(GREEN)Generating GraphQL code...$(NC)"
	@pnpm run gqlgen

sqlc:
	@echo "$(GREEN)Generating SQLC queries...$(NC)"
	@pnpm run sqlc

mock:
	@echo "$(GREEN)Generating mock for $(name)...$(NC)"
	@cmd="cd $(BACKEND_DIR) && go run github.com/vektra/mockery/v2@latest --name=$(name) --recursive"; \
	if [ -n "$(filename)" ]; then \
		cmd="$$cmd --filename=$(filename)"; \
	fi; \
	if [ -n "$(srcpkg)" ]; then \
		cmd="$$cmd --srcpkg=$(srcpkg)"; \
	fi; \
	if [ -n "$(structname)" ]; then \
		cmd="$$cmd --structname=$(structname)"; \
	fi; \
	eval $$cmd

.PHONY: gqlgen sqlc mock

#
# Build Commands
#
build:
	@echo "$(GREEN)Building all services...$(NC)"
	@pnpm build

build-backend:
	@echo "$(GREEN)Building Go backend...$(NC)"
	@pnpm build --filter=core
	@echo "$(BLUE)Binary created at $(BACKEND_DIR)/build/$(NAME)$(NC)"

build-frontend:
	@echo "$(GREEN)Building SvelteKit frontend...$(NC)"
	@pnpm build --filter=web

.PHONY: build build-backend build-frontend

#
# Test Commands
#
test:
	@echo "$(GREEN)Running all tests...$(NC)"
	@pnpm test

test-backend:
	@echo "$(GREEN)Running Go tests...$(NC)"
	@pnpm run test --filter=core

test-frontend:
	@echo "$(GREEN)Running Go tests...$(NC)"
	@pnpm run test --filter=web

.PHONY: test test-backend

#
# Code Quality
#
lint:
	@echo "$(GREEN)Running linters...$(NC)"
	@pnpm lint

format:
	@echo "$(GREEN)Formatting code...$(NC)"
	@pnpm format

format-check:
	@echo "$(GREEN)Checking code format...$(NC)"
	@pnpm format:check
	@cd $(BACKEND_DIR) && test -z "$(shell gofmt -l .)" || (echo "Go files need formatting. Run 'make format'" && exit 1)

check-types:
	@echo "$(GREEN)Type checking...$(NC)"
	@pnpm check-types

.PHONY: lint format format-check check-types

#
# Cleanup
#
clean:
	@echo "$(GREEN)Cleaning build artifacts...$(NC)"
	@rm -rf $(BACKEND_DIR)/build
	@rm -rf $(BACKEND_DIR)/tmp
	@rm -rf $(FRONTEND_DIR)/.svelte-kit
	@rm -rf $(FRONTEND_DIR)/build
	@rm -rf .turbo
	@echo "$(BLUE)Clean complete$(NC)"

clean-all: clean
	@echo "$(GREEN)Removing node_modules and Go cache...$(NC)"
	@rm -rf node_modules
	@find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	@cd $(BACKEND_DIR) && go clean -cache -modcache

.PHONY: clean clean-all

#
# Setup (for first-time setup)
#
setup:
	@echo "$(GREEN)Setting up project...$(NC)"
	@pnpm install
	@make db-up
	@sleep 3
	@cd $(BACKEND_DIR) && cp .env.example .env || true
	@make migrate-up
	@echo "$(BLUE)Setup complete! Run 'make dev' to start development$(NC)"

.PHONY: setup
