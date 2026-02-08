# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

WorkPlate is a Tauri 2.0 desktop app for task management with Google Calendar integration. React 19 + TypeScript frontend, Rust backend, SQLite for local persistence.

## Commands

```bash
npm run dev          # Vite dev server (port 1420)
npm run tauri dev    # Full Tauri app with hot reload
npm run build        # TypeScript check + production build
npm test             # Run all Vitest tests
npm run test:watch   # Watch mode
npm run test:acceptance  # BDD acceptance tests only
npx vitest run src/path/to/file.test.tsx  # Run a single test file
npm run db:reset     # Delete local SQLite database
```

Rust backend builds automatically via `npm run tauri dev`. For Rust-only changes: `cd src-tauri && cargo build`.

## Architecture

### Frontend (`/src`)

- **Views**: `MyPlate` (current tasks at `/`), `Backlog` (`/backlog`), `MyDay` (`/my-day` — calendar view)
- **Services**: Repository pattern with context-based dependency injection
  - `task-repository.ts` — CRUD over Tauri SQL plugin
  - `calendar-service.ts` — Google Calendar OAuth + API
  - `*-context.tsx` — React Context providers that inject services
  - `*.mock.ts` — Mock implementations used in tests
- **Hooks**: `use-tasks` (task CRUD + reorder), `use-calendar` (calendar events + OAuth)
- **Store**: Zustand (`app-store.ts`) for UI state (sidebar, filters, editing)
- **Drag & Drop**: `@dnd-kit` for sortable task reordering within status columns

### Backend (`/src-tauri`)

- `lib.rs` — Tauri plugin setup and command registration
- `db.rs` — SQLite migration runner (embeds SQL files at compile time)
- `oauth.rs` — Local TCP server (port 8085) for Google OAuth redirect callback
- `migrations/` — Sequential SQL migration files

### Database

SQLite at `~/Library/Application Support/com.workplate.app/workplate.db`. Two tables:
- **tasks**: id, title, description, priority (P0-P3), size (S/M/L/XL), status (plate/backlog/done), sort_order, project, blocking, link
- **settings**: key-value store for OAuth tokens

### Testing

Tests use Vitest + Testing Library with jsdom. Services are mocked via context providers — components receive mock implementations through the same DI mechanism used in production. Acceptance tests in `/src/acceptance/` follow BDD patterns.

### Key Patterns

- All data access goes through repository/service interfaces, never direct SQL from components
- Task status values: `plate`, `backlog`, `done`
- Priority: `P0`–`P3`; Size: `S`, `M`, `L`, `XL`
- Tailwind 4 with CSS custom properties for theming
