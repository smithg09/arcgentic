# Contributing to Arcgentic

First off, thank you for considering contributing to Arcgentic! We welcome contributions of all sizes—whether it's a bug fix, new feature, documentation improvement, or a design polish.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate in all communications.

## General Workflow

1. **Fork the repository** to your own GitHub account.
2. **Clone your fork** locally: `git clone https://github.com/YOUR_USERNAME/arcgentic.git`
3. **Set up the project** following the instructions in [`getting-started.md`](./getting-started.md).
4. **Create a branch** for your work: `git checkout -b feature/your-feature-name` or `fix/your-fix-name`.
5. **Make your changes**.
6. **Submit a Pull Request** against the `main` branch.

## Development Guidelines

### Monorepo Practices
Arcgentic uses Turborepo. When adding a shared UI element, it should go into `packages/ui` so it can be consumed by other apps.
Run `pnpm install` from the root whenever modifying `package.json` files.

### Code Style
- **JavaScript/TypeScript**: We use Prettier and ESLint. We enforce styling via the `packages/eslint-config`. Run `pnpm lint` and `pnpm format` before opening a PR.
- **Go**: Always run `go fmt ./...` and `golangci-lint run`.
- **Python**: Use `black` and `flake8` for formatting and linting `apps/agent_service`.

### Branch Naming
Use descriptive prefixes:
- `feat/` for new features
- `fix/` for bug fixes
- `docs/` for documentation updates
- `refactor/` for code refactoring
- `chore/` for dependency updates or minor configuration changes

### Commits
Write clear, concise commit messages. We encourage the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

Example:
`feat(agent): add support for ollama models`
`fix(ui): resolve concept map overlapping nodes`

## Getting Help
If you run into issues, please open a GitHub Discussion or drop an issue labeled `question`.

We're excited to review your PR!
