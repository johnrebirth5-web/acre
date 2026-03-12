# Back Office Implementation Log

## Current milestone

- `Back Office MVP+`
- Major core modules now exist as real routes and real workflow foundations
- Current focus is strengthening workflow fidelity, admin controls, responsive stability, and long-context documentation

## Recently completed major work

- Real Office Dashboard, Pipeline, Transactions, Contacts, Tasks, Reports, Activity, Accounting foundations
- Notifications Center MVP:
  - real `/office/notifications`
  - user-scoped inbox distinct from `Activity Log`
  - read / unread state
  - actionable deep links into task review, offers, signatures, incoming updates, follow-up, and onboarding
  - notification write paths wired into existing workflow services
- Company Library / Internal Document Library MVP:
  - real `/office/library`
  - `LibraryFolder` / `LibraryDocument`
  - folder tree + file list + preview pane
  - local file upload / preview / download
  - activity log coverage for folder/document actions
- Transaction detail workflow expansion:
  - contacts
  - finance
  - tasks / approvals / compliance
  - documents / forms / eSignature / incoming updates
  - offers
  - commissions
- Accounting MVP:
  - chart of accounts
  - accounting transactions
  - EMD
  - agent billing
- Commission Management MVP:
  - plans
  - rules
  - assignments
  - persisted calculations
- Agent Management MVP and follow-up strengthening:
  - roster
  - profile hub
  - onboarding
  - teams
  - goals
- Office Settings / Admin MVP
- Back Office design system and responsive hardening passes
- long-context spec structure under `docs/specs`
  - added `agent-management-spec.md`
  - added `buyer-offers-spec.md`

## Next recommended work

- deepen notification automation only where real scheduling or assignment models exist
- deepen approval/document workflow parity
- strengthen storage strategy beyond local filesystem MVP
- expand Activity Log coverage for newer modules
- improve office-level admin automation and checklist application behavior
- strengthen statement/export/report outputs across accounting, commissions, and billing
- continue filling any remaining module-level specs before future large feature prompts depend on chat history

## Key product and engineering decisions

- Keep `Back Office` as the main current product priority
- Reuse shared foundations instead of spawning parallel mini-systems
- Keep workflow state explicit in Prisma models
- Keep permissions explicit in `@acre/auth`
- Keep activity/audit behavior integrated with `AuditLog`
- Prefer internal MVP workflow foundations over fake external integrations

## Known limitations

- object storage is still local filesystem MVP
- many integrations are intentionally not implemented:
  - MLS ingestion
  - external eSignature vendors
  - QuickBooks sync
  - ACH payout execution
  - email/SMS delivery
- some modules are still `MVP`, not full product parity
- some workflow automation remains manual or manager-driven
- time-based notification reminders currently reconcile on inbox load, not via background jobs

## How to update this file

When a major feature lands:

1. add it to `Recently completed major work`
2. remove or downgrade any now-resolved limitation
3. refresh `Next recommended work`
4. keep this file brief and operational
