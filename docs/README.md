# Welcome to Arcgentic Documentation

Arcgentic is your personal AI learning ecosystem. An open-source, multi-agent platform that autonomously crafts highly personalized learning content to help you master any subject.

By leveraging multi-agent orchestration via LangGraph, Arcgentic builds an adaptive curriculum specifically for you—featuring interactive concept roadmaps, flashcards, long-form explanations, and audio podcasts.

## Tech Stack

A polyglot, multi-service architecture built for modularity and performance. Each layer is independently deployable and uses best-in-class tooling for its domain.

| Layer | Technology |
|---|---|
| **Frontend** | TypeScript, React 19, Vite, Tailwind CSS v4, shadcn/ui |
| **State & Routing** | TanStack Router, TanStack Query, Zustand |
| **User Service** | Go 1.21+, Echo, GraphQL (gqlgen), sqlc |
| **Agent Service** | Python 3.11+, Flask, LangGraph, LangChain |
| **Web Server** | Nginx |
| **Database** | PostgreSQL |
| **Containerization**| Docker, Docker Compose |
| **Monorepo** | Turborepo, pnpm workspaces |

## Deployment Stack

Production-grade infrastructure on AWS with fully automated CI/CD. Zero static credentials — GitHub Actions authenticates via OIDC federation.

| Component | Technology |
|---|---|
| **Containerization**| Amazon ECR |
| **Orchestration** | Amazon EKS (Kubernetes) |
| **Ingress / TLS** | AWS ALB + ACM Certificate |
| **Secrets** | AWS Secrets Manager → External Secrets Operator |
| **Database** | Amazon RDS (PostgreSQL) |
| **CI/CD** | GitHub Actions |
| **Landing Page** | GitHub Pages (React build) |
| **Documentation** | Docsify (via GitHub Pages) |

---

## Documentation Index

Whether you are looking to run the platform locally or understand the under-the-hood multi-agent flows, these guides will help you navigate Arcgentic's codebase.

- **[Getting Started](getting-started.md)** 
  Instructions on cloning the monorepo, fulfilling prerequisites, and spinning up the full stack (Web UI, Agent API, User/GraphQL API) via Docker.

- **[Agentic Harness](agent-harness.md)**
  Deep dive into the Python multi-agent system, including the Supervisor/Worker architecture, UI tools, and state persistence.
  
- **[Architecture Overview](architecture.md)** 
  A high-level view of our monorepo setup (Turborepo + pnpm), tech stack layout, and service separation.

- **[AWS Deployment](aws-deployment.md)**
  Comprehensive guide to deploying Arcgentic to production on Amazon EKS with automated CI/CD via GitHub Actions.

- **[Contributing Options](contributing.md)** 
  Guidelines for developers wishing to branch off, run testing environments, format code, and submit Pull Requests to improve Arcgentic.
