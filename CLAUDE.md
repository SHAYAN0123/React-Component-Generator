# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup          # First-time setup: install deps, generate Prisma client, run migrations
npm run dev            # Start dev server with Turbopack (uses node-compat.cjs shim)
npm run build          # Production build
npm run lint           # Run ESLint
npm run test           # Run Vitest
npm run db:reset       # Force-reset Prisma migrations
```

To run a single test file:
```bash
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx
```

Requires `ANTHROPIC_API_KEY` in `.env` for live AI features (app works in mock mode without it).

## Architecture

**UIGen** is an AI-powered React component generator. Users describe components in a chat interface; Claude generates/edits code using tool calls, and a live preview renders the result.

### Request Flow

1. User message → `POST /api/chat` (`src/app/api/chat/route.ts`)
2. Route calls `streamText()` (Vercel AI SDK) with Anthropic Claude + two tools: `str_replace_editor` and `file_manager`
3. Claude uses those tools to write/edit files in the virtual file system
4. On stream completion, chat history and file state are persisted to the DB via Prisma
5. Frontend renders streamed messages and re-renders the preview iframe

### Virtual File System

`src/lib/file-system.ts` — in-memory `VirtualFileSystem` class with no disk I/O. Files are serialized as JSON and stored in the `Project.data` DB column. Managed via `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`). The preview iframe receives files and runs JSX transformation client-side via `src/lib/transform/jsx-transformer.ts` (uses `@babel/standalone`).

### AI Tools

- `src/lib/tools/str-replace.ts` — string-replace editor for surgical code edits
- `src/lib/tools/file-manager.ts` — create/delete/rename files
- `src/lib/prompts/generation.tsx` — system prompt for component generation
- `src/lib/provider.ts` — switches between Anthropic and a mock `MockLanguageModel` (when no API key)

### Auth

JWT-based using `jose`. Passwords hashed with `bcrypt`. `src/middleware.ts` protects routes. Server actions in `src/actions/` handle DB operations. Projects support anonymous users (`userId` is optional).

### State Management

React Contexts only — no external state library:
- `ChatContext` (`src/lib/contexts/chat-context.tsx`) — message list, loading state
- `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) — virtual FS state

### Database

Prisma + SQLite. Two models: `User` (email/password) and `Project` (stores `messages` and `data` as JSON strings). Always reference `prisma/schema.prisma` for the authoritative database structure.

### UI

shadcn/ui components (in `src/components/ui/`) with Tailwind CSS v4. Monaco Editor for code viewing. Resizable panels split the chat, editor, and preview panes.

## Code Style

Use comments sparingly — only on complex or non-obvious logic.
