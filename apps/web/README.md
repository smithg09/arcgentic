# Arcgentic Web

The React frontend for the Arcgentic learning platform.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for bundling and dev server
- **TanStack Router** for file-based routing
- **TanStack Query** for server state management
- **Tailwind CSS v4** for styling
- **shadcn/ui** (Radix primitives) for UI components
- **Mermaid** for diagram rendering

## Project Structure

```
src/
├── api/              # API client modules
│   ├── agent/        # Agent service REST calls
│   └── graphql/      # User service GraphQL queries/mutations
├── components/
│   ├── chat/         # Chat panel, input, message bubbles
│   ├── content/      # Resource viewers (podcast, presentation, flashcards, etc.)
│   ├── dashboard/    # Dashboard page components (hero, sessions list, onboarding)
│   ├── layout/       # Header, settings modal
│   └── ui/           # App-specific UI (logo, floating geometry)
├── hooks/            # Custom React hooks (SSE, model settings, theme)
├── lib/              # Utility functions and constants
├── pages/            # Route page components
└── types/            # TypeScript type definitions
```

## Shared UI Package

Generic UI primitives (Button, Dialog, Tabs, etc.) live in `packages/ui` as `@arcgentic/ui`. Import them as:

```tsx
import { Button } from '@arcgentic/ui/button'
import { Dialog, DialogContent } from '@arcgentic/ui/dialog'
```

## Environment

The dev server proxies API requests automatically:
- `/api/*` → `http://localhost:5001` (agent service)
- `/query` → `http://localhost:8080` (user service GraphQL)

No `.env` file needed for the web app in development.

## Available Scripts

```bash
pnpm dev       # Start Vite dev server on :5173
pnpm build     # Type-check and build for production
pnpm lint      # Run ESLint
pnpm preview   # Preview production build
```