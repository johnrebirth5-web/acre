# Back Office Overview

## Purpose

This file is the high-level product map for the current `Office / Back Office` system. Use it to understand what each module is for, how mature it is, and what still needs follow-up work.

## Module map

### Dashboard

- What it is for:
  - Office landing page for current operational pressure, status counts, recent transactions, and reference links.
- Current maturity:
  - `MVP`
- Follow-up work:
  - stronger manager KPIs
  - better cross-module drilldowns
  - more configurable office summaries

### Pipeline

- What it is for:
  - management-oriented pipeline workspace with live funnel summary, monthly closed/cancelled rollups, top-level metric summary, and a query-driven working transaction list.
- Current maturity:
  - `MVP / refined`
- Follow-up work:
  - deeper analytics drilldowns
  - more advanced owner/team slicing
  - more cross-links into downstream transaction work queues

### Reports

- What it is for:
  - management reporting workspace with transaction, agent/team, commission, accounting/payment, and earnest money visibility.
- Current maturity:
  - `MVP / refined`
- Follow-up work:
  - add more controlled period definitions beyond the current native-date-per-module behavior
  - expand more accounting-side drilldowns only where the underlying data model is explicit
  - keep reducing transitional gaps between report slices and downstream working queues

### Transactions

- What it is for:
  - transaction list, transaction detail, and transaction-centered workflow hub.
- Current maturity:
  - `strong MVP`
- Follow-up work:
  - deeper listing-side workflow parity
  - richer transaction automation
  - more operational subviews inside detail

### Contacts

- What it is for:
  - internal contact/party management tied to transaction workflows and follow-up tasks.
- Current maturity:
  - `MVP`
- Follow-up work:
  - richer CRM-like workflows
  - more advanced relationship modeling
  - more contact-side automation

### Tasks

- What it is for:
  - operational task list, transaction tasks, checklist workflows, review/compliance workflow, approval states, and the dedicated `Approve Docs` reviewer queue.
- Current maturity:
  - `strong MVP`
- Current notable behavior:
  - `Approve Docs` uses the same `TransactionTask` review workflow as task list and transaction detail, including current-user actionable review filtering and explicit secondary-approval separation.
- Follow-up work:
  - richer template application
  - richer reminder tuning and delivery beyond the current in-product inbox
  - reviewer assignment / SLA handling beyond the current permission-based Approve Docs queue

### Notifications

- What it is for:
  - signed-in user inbox for actionable Back Office alerts and reminders tied to real workflow state.
- Current maturity:
  - `MVP`
- Current notable behavior:
  - `/office/notifications` is now a real user-scoped inbox route.
  - notification records are persisted separately from `AuditLog`.
  - inbox supports read/unread state, mark-all-read, category/type filtering, and deep links into the nearest real workflow page.
  - current coverage is intentionally limited to real signals:
    - task review / second review / rejection
    - offer created / received / expiring soon
    - signature pending / completed
    - incoming update pending review
    - follow-up assigned / overdue
    - onboarding assigned / due soon
- Follow-up work:
  - add scheduler-driven reminder delivery when a real job runner exists
  - add archive/dismiss behavior if the inbox grows beyond read state
  - keep extending coverage only where a real workflow already exists

### Activity Log

- What it is for:
  - account activity + operational alerts for auditable system actions and live workflow issues.
- Current maturity:
  - `MVP`
- Current notable behavior:
  - remains intentionally separate from the personal notifications inbox.
- Follow-up work:
  - broader event coverage for future modules
  - deeper filtering and export
  - more alert types tied to newly implemented workflows

### Library

- What it is for:
  - internal company document library with folders, file metadata, PDF-first preview, and office/company scope.
- Current maturity:
  - `MVP`
- Current notable behavior:
  - `/office/library` is now backed by Prisma `LibraryFolder` and `LibraryDocument`, not the old mock resource feed.
  - primary workflow is folder select -> file list -> preview/details pane.
  - major folder/document actions write into `AuditLog`.
- Follow-up work:
  - stable PDF page indexing and richer metadata extraction
  - safer folder deactivation/archive workflow
  - future object storage replacement for local filesystem storage

### Accounting

- What it is for:
  - transaction-side accounting, chart of accounts, accounting transactions, EMD, agent billing, commission management.
- Current maturity:
  - `MVP`
- Follow-up work:
  - stronger reporting
  - deeper posting/reconciliation workflows
  - future integration bridges

### Documents / Forms / eSignature

- What it is for:
  - transaction documents, unsorted docs, internal forms, internal eSignature workflow, and incoming update review.
- Current maturity:
  - `MVP`
- Follow-up work:
  - object storage replacement for local file storage
  - richer template management
  - future vendor integrations

### Offers

- What it is for:
  - buyer offer workflow inside transaction management, including comparison, comments, and offer-linked docs/forms/signatures.
- Current maturity:
  - `MVP`
- Follow-up work:
  - optional global offers queue
  - inbound offer ingestion when a real source exists
  - richer listing-side workflow parity

### Settings / Admin

- What it is for:
  - user access management, team admin, field requirements, and checklist templates.
- Current maturity:
  - `MVP`
- Follow-up work:
  - richer multi-office access controls
  - stronger template application behavior
  - broader settings coverage

### Agent Management

- What it is for:
  - agent roster, operational profile hub, onboarding, goals, team visibility, and progress tracking.
- Current maturity:
  - `MVP+`
- Follow-up work:
  - stronger onboarding template system
  - richer goal/performance views
  - optional self-view mode

### Commission Management

- What it is for:
  - commission plans, assignments, rules, calculation rows, statement-ready visibility, payout-ready workflow context.
- Current maturity:
  - `MVP`
- Follow-up work:
  - deeper approval/payout workflow
  - richer statement generation
  - stronger accounting bridge

## General product follow-up themes

- reduce remaining mock/transitional edges
- improve audit/event coverage across newer modules
- replace local file storage with production-ready object storage
- keep Back Office aligned with BoldTrail/Brokermint workflow behavior without faking unsupported integrations
