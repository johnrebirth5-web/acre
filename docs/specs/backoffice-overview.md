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
- Follow-up work:
  - richer template application
  - reminder/notification automation
  - reviewer assignment / SLA handling beyond the current permission-based Approve Docs queue

### Activity Log

- What it is for:
  - account activity + operational alerts for auditable system actions and live workflow issues.
- Current maturity:
  - `MVP`
- Follow-up work:
  - broader event coverage for future modules
  - deeper filtering and export
  - more alert types tied to newly implemented workflows

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
