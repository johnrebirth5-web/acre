# Acre Repository Guide

This repository is the `Acre` monorepo. It currently uses `npm` workspaces and the root scripts defined in [package.json](/Users/openclaw_john/工作文件夹/Acre/package.json).

## Workspace shape

- `apps/web`: the current Next.js app
- `packages/auth`: shared role and permission definitions
- `packages/backoffice`: shared mock/domain data used by pages and API routes
- `packages/db`: Prisma schema and database package
- `packages/ui`: shared UI primitives

## Use the existing root scripts

Run commands from the repo root:

- `npm run dev`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run db:validate`

## Validation after meaningful code changes

After meaningful code changes, run:

- `npm run typecheck`
- `npm run lint`
- `npm run build`

If the Prisma schema changes, also run:

- `npm run db:validate`

## Documentation must stay in sync

Important feature changes or new environment variables must update:

- [README.md](/Users/openclaw_john/工作文件夹/Acre/README.md)
- [docs/architecture.md](/Users/openclaw_john/工作文件夹/Acre/docs/architecture.md)
- [docs/deployment.md](/Users/openclaw_john/工作文件夹/Acre/docs/deployment.md)
- [docs/env.md](/Users/openclaw_john/工作文件夹/Acre/docs/env.md)
- [docs/decisions.md](/Users/openclaw_john/工作文件夹/Acre/docs/decisions.md)

## Working style

- Work incrementally.
- Prefer the smallest change that fits the current architecture.
- Avoid speculative refactors or wide cleanup passes unless the task explicitly requires them.
- Keep changes aligned with the repo's current real implementation, not planned future architecture.
