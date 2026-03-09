# Acre

Initial monorepo for the Acre internal agent and office platform.

## Current Scope

- `apps/web`: responsive Next.js app for agent and office workflows
- `packages/auth`: role and permission model for agent and office users
- `packages/backoffice`: shared route metadata, sample domain objects, and workspace structure
- `packages/db`: Prisma schema for organizations, listings, CRM, events, resources, and audit logs
- `packages/ui`: shared UI primitives used across desktop and mobile layouts

## Current Routes

- `/`: platform overview and role entry
- `/agent/dashboard`
- `/agent/listings`
- `/agent/clients`
- `/agent/notifications`
- `/agent/resources`
- `/office/dashboard`
- `/office/listings`
- `/office/events`
- `/office/resources`

## API Routes

- `/api/health`
- `/api/agent/dashboard`
- `/api/office/dashboard`
- `/api/listings`
- `/api/clients`
- `/api/events`
- `/api/resources`

## Commands

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`

## Implementation Direction

- Mobile and desktop share one responsive shell
- Agent and office use separate navigation surfaces on top of a shared design system
- Back-office pages and API routes read from the same service layer in `@acre/backoffice`
- Permissions are centralized in `@acre/auth`
- Postgres schema is defined in `packages/db/prisma/schema.prisma`
- Next phases will add listings ingestion, CRM, notifications, resources, analytics, and AI workflows

## Deployment Path

- Start locally with `npm run dev`
- Push the repository to GitHub
- Connect `apps/web` to Vercel after the first stable milestone
