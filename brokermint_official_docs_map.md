# Brokermint Official Docs Map

This file maps product areas to official Brokermint / BoldTrail BackOffice pages and help-center articles. It is meant to support an original implementation with similar capability coverage.

## Official Product Positioning

- Product homepage:
  - [BoldTrail BackOffice homepage](https://brokermint.com/)
- Official top-level solution areas called out on the homepage:
  - Commission Automation
  - Transaction Management
  - Accounting
  - Agent Management
  - Reporting & Analytics

Source:
- [Homepage](https://brokermint.com/)

## Module Map

### Transactions

Official feature page:
- [Transaction Management](https://brokermint.com/real-estate-transaction-management/)

Official claims:
- Checklists
- eSignatures + Forms
- Notifications
- Audits
- Buyer Offers

Key official help articles:
- [How to create a transaction](https://support.brokermint.com/en/articles/7126151-how-to-create-a-transaction)
- [Approving documents](https://support.brokermint.com/en/articles/7126043-approving-documents)
- [Mapping Forms / eSignature Templates](https://support.brokermint.com/en/articles/7126009-mapping-forms-esignature-templates)

What the docs confirm:
- transactions are the central container for documents, offers, and details
- the lifecycle now begins with `Opportunity`
- admins can review docs in a dedicated approval workflow
- library-based eSignature templates can be inserted into checklists/tasks

Observed matching in the app:
- `#/transactions`
- `#/approve-documents`
- `#/tasks`
- `#/transactions/:id/checklists/:id`
- `#/transactions/:id/documents/:filter?`
- `#/transactions/:id/offers`
- buyer-offer and eSign routes declared in bundle

### Pipeline

Official help article:
- [Pipeline](https://support.brokermint.com/en/articles/7126147-pipeline)

What the docs confirm:
- pipeline is presented as a funnel
- it combines listings, pending deals, and closed transactions
- it is meant as a live sales-funnel view

Observed matching in the app:
- `#/pipeline`
- visible buckets include `Opportunity`, `Active`, `Pending`, `Closed`, `Cancelled`

### Approvals and Compliance

Official feature page:
- [Transaction Management](https://brokermint.com/real-estate-transaction-management/)

Official help article:
- [Approving documents](https://support.brokermint.com/en/articles/7126043-approving-documents)

What the docs confirm:
- approval is admin-centric
- users can review transaction context without leaving approval flow
- rejection emails can include notes and copied participants
- the process supports batch document handling and better notifications

Observed matching in the app:
- `#/approve-documents`
- live page showed pending review queue and `Review` actions

### Reports and Analytics

Official feature page:
- [Reporting + Analytics](https://brokermint.com/real-estate-reporting-and-analytics/)

Official claims:
- Dashboards
- Report Builder
- Transaction Analytics
- Agent Performance
- Dash Integration

Official help article:
- [Company reports](https://support.brokermint.com/en/articles/7435515-company-reports)

What the docs confirm:
- native plus custom reports
- export and saved templates
- report filters and sortable columns
- system-level report families such as:
  - Production Summary
  - Production YoY
  - Production & Agent Trend
  - Active Transactions
  - Canceled Transactions
  - Agent Ranking
  - Document Review Status
  - Deposit Status
  - Outstanding Signings Status

Observed matching in the app:
- `#/reports`
- company reports live page
- export and configure actions visible in UI

### Agent Management

Official feature page:
- [Agent Management](https://brokermint.com/real-estate-agent-management/)

Official claims:
- Agent Profiles
- Onboarding
- Goal Setting
- Team Management
- Agent Platform

Official help articles:
- [User permissions](https://support.brokermint.com/en/articles/7126108-user-permissions)
- [Agent onboarding](https://support.brokermint.com/en/articles/7126082-agent-onboarding)

What the docs confirm:
- onboarding is checklist-driven
- permissions are fine-grained and user-specific
- user profile management includes access control rather than only simple roles

Observed matching in the app:
- `#/account/users`
- `#/account/checklists`
- `#/agent-onboardings/:id`
- goal amount and team data visible in user details and dashboard widgets

### Permissions

Official help article:
- [User permissions](https://support.brokermint.com/en/articles/7126108-user-permissions)

What the docs confirm:
- permissions control access to data and actions
- UI path is `Users > profile > Permissions`
- permissions include transaction actions and buyer offer actions

Examples explicitly described by official docs:
- create transactions
- edit transactions
- delete transactions
- cancel transactions
- access all company transactions
- close/reopen transactions
- move transactions across sub-accounts
- buyer-offer access, create, edit, delete, all-company access

Observed matching in the bundle:
- permission map in `AccountUserPermissionsStructure`
- route guards for pipeline, accounting, company reports, approvals, buyer offers

### Notifications

Official help article:
- [Notifications](https://support.brokermint.com/en/articles/7126171-notifications)

What the docs confirm:
- notification system is email-based
- it supports both daily-summary and immediate events
- examples include:
  - Tasks due
  - Documents to approve
  - Transaction created

Observed matching in the app:
- `#/user/notifications`
- live page showed toggles for tasks due, documents to approve, transaction created, transaction closed, contact assigned, and more

### Contacts

Official help article:
- [How to add and edit contacts](https://support.brokermint.com/en/articles/7126104-how-to-add-and-edit-contacts)

What the docs confirm:
- contacts can be created from inside a transaction
- existing users/contacts can be searched and assigned to roles
- contacts participate in transaction workflows, not just standalone CRM records

Observed matching in the app:
- `#/contacts`
- `#/transactions/:id/contacts`
- contact details include comments/activity and billing-related areas

### Commission Automation

Official homepage area:
- Commission Automation on the homepage

Official help article:
- [Commission plans](https://support.brokermint.com/en/articles/7126048-commission-plans)

What the docs confirm:
- commission handling supports complex brokerage cases
- docs mention:
  - sliding scales
  - referral fees
  - franchise fees
- product positioning emphasizes simplified commission tracking

Observed matching in the app:
- `#/account/commissions`
- `#/transactions/:id/finance/commissions`
- commission plans UI with chained plans and company/agent paid calculations

### Accounting

Official feature page:
- [Accounting](https://brokermint.com/real-estate-accounting/)

Official claims:
- Cash Flows
- Agent Billing
- Monthly Agent Statements
- Commissions and Expenses
- QuickBooks Integration

What the docs confirm:
- ledgers and account tracking are a first-class product area
- agent billing supports invoices and credit-card charges
- monthly statements are generated and emailed
- ACH payment flows are part of the positioning

Observed matching in the app:
- `#/accounting/chart-of-accounts`
- `#/accounting/general-ledger`
- `#/accounting/agent-ledger`
- `#/accounting/payment-gateways`
- `#/billing`
- `#/recurring-billing`

### Library and eSignature Templates

Official help article:
- [Mapping Forms / eSignature Templates](https://support.brokermint.com/en/articles/7126009-mapping-forms-esignature-templates)

What the docs confirm:
- library access is permissioned
- admins can create eSignature templates
- templates can be pulled into checklist locations inside transactions

Observed matching in the app:
- `#/library`
- eSign resources and document package flows in the bundle

### Integrations

Official feature page:
- [Integrations](https://brokermint.com/integrations/)

What the docs confirm:
- category structure:
  - CRM
  - MLS
  - Storage
  - Accounting
  - Corporate
- integrations named on official page include:
  - API
  - Apination
  - Boomtown
  - Lofty
  - CINC
  - DocuSign Signature
  - Dropbox
  - Flex
  - Follow up Boss
  - Google Calendar
  - Google Drive
  - Google Sheets
  - Inside Real Estate
  - JetClosing
  - Liondesk
  - Matrix
  - QuickBooks Desktop
  - QuickBooks Online
  - Realogy Dash
  - Wise Agent
- official positioning says their open API supports custom integrations

Observed matching in the app:
- `#/user/add-ons`
- dedicated configuration routes for MLS, Dotloop, Dropbox, Follow Up Boss, kvCORE, Boomtown, Dash, RE/MAX, BHHS

## Best Evidence Crosswalk

For future implementation work, treat these as the strongest combined evidence:

1. Official feature pages define product marketing boundaries.
2. Help-center articles define real workflows and admin/user terminology.
3. Logged-in UI confirms what the current account actually has enabled.
4. Bundled application code confirms hidden routes, resources, and permissions.

## Recommended Next Documentation Pass

The next highest-value official-doc pass should cover:
- custom reports
- checklist templates
- document uploading
- buyer offers
- MLS integration
- Dotloop / Follow Up Boss / QuickBooks integration setup
- accounting ledger behavior

## Second Pass: Workflow-Specific Docs

### Document Uploading

Official help article:
- [Uploading documents](https://support.brokermint.com/en/articles/7126149-uploading-documents)

What the docs confirm:
- document handling is checklist-centric
- there are four documented ingestion paths:
  - direct upload into a task
  - add via generated email address
  - drag and drop into transaction
  - pull signed documents from DocuSign
- unsorted documents are a first-class staging area
- documents can be attached to newly created tasks if no task fits
- company library can supply shared documents into transactions

Observed matching in the app:
- transaction documents page
- unsorted documents route
- checklist task upload affordance
- company library route

### Dotloop Integration

Official help article:
- [Dotloop Integration](https://support.brokermint.com/en/articles/7126007-dotloop-integration)

What the docs confirm:
- loops create incoming transactions in BoldTrail BackOffice
- assignment is agent-aware
- sync interval is documented as every 15 minutes
- users accept imported loops as incoming transactions rather than fully formed records

Observed matching in the app and bundle:
- incoming-transaction conversion commands in transaction resource
- add-on configuration route for Dotloop

### Follow Up Boss Integration

Official help article:
- [Follow Up Boss](https://support.brokermint.com/en/articles/7126096-follow-up-boss)

What the docs confirm:
- integration is bi-directional
- FUB deals can create incoming transactions in BoldTrail BackOffice
- BoldTrail BackOffice transactions can sync back to FUB as deals
- documented core fields include:
  - deal name / address
  - price
  - commission
  - close date
  - people
  - team members / users
  - description
- contact sync and user mapping are configuration concerns
- only one company-level FUB connection is allowed

Observed matching in the app and bundle:
- add-on configuration route for Follow Up Boss
- incoming transaction flow
- contact/user mapping in add-on configuration copy

### MLS Integration

Official help article:
- [MLS Integration](https://support.brokermint.com/en/articles/7126089-mls-integration)

What the docs confirm:
- MLS sync is one-way into BoldTrail BackOffice
- active listings and updates flow from MLS into the system
- the platform cannot create or modify MLS listings
- full-feed MLS supports listing lookup by MLS number or property address
- help article explicitly distinguishes BackOffice RETS integration from BoldTrail IDX integration

Observed matching in the app:
- MLS configuration page
- toggles for on-demand active listing search and incoming-transaction loading

### QuickBooks Integration

Official help article:
- [BoldTrail BackOffice & QuickBooks Integration: General Ledger (V2)](https://support.brokermint.com/en/articles/9388488-boldtrail-backoffice-quickbooks-integration-general-ledger-v2)

What the docs confirm:
- integration target is QuickBooks Online
- General Ledger entries sync 1:1 from BackOffice to QuickBooks
- brokerage income and expense entries are both part of the sync
- real-estate transactions can create separate entries by represented side
- setup requires chart-of-accounts alignment and connected QuickBooks bank accounts

Observed matching in the app:
- accounting general ledger page
- payment gateways page
- QuickBooks add-on listing

### Offers / Buyer-Side Workflow

Official help article:
- [Managing Offers on Your Listing](https://support.brokermint.com/en/articles/7126145-managing-offers-on-your-listing)

What the docs confirm:
- offers are embedded inside transactions
- listing-side workflow uses a shareable link to collect offers
- buyer rep agreements can be signed before offers
- offers tab supports:
  - received submissions
  - notes
  - counteroffers
  - buyer-agent email actions

Observed matching in the app and bundle:
- transaction `offers` subpage
- buyer-offer routes
- offer resources and public-link behavior in code

### Custom Fields and Extensibility

Official help article:
- [Additional custom fields](https://support.brokermint.com/en/articles/7126061-additional-custom-fields)

What the docs confirm:
- the Fields area is broader than transaction-only fields
- official configurable objects include:
  - transaction fields
  - transaction roles
  - transaction types
  - user fields
  - contact fields
  - contact types
- some transaction fields can be required

Observed matching in the app:
- live Fields page showed all major list/template categories, including several more than the article excerpt listed

### Checklist Task Assignment Detail

Official help article:
- [How to add a task to the checklist](https://support.brokermint.com/en/articles/7126161-how-to-add-a-task-to-the-checklist)

What the docs confirm:
- tasks can be assigned only to users with transaction access
- task assignment is coupled to transaction owner fallback
- task reassignment happens automatically when the owner changes or a user is removed

Observed matching in the app:
- tasks/checklists are deeply tied to transaction membership and user permissions

### Custom Reports

Strongest official source currently identified:
- [Reporting + Analytics](https://brokermint.com/real-estate-reporting-and-analytics/)

What the docs confirm:
- report builder is a first-class product capability
- native reports plus custom report building are both supported
- templates can be saved
- export to Excel is explicitly called out

Best complementary source:
- [Company reports](https://support.brokermint.com/en/articles/7435515-company-reports)

Current evidence gap:
- no separate help-center article specifically focused on authoring custom reports was confirmed in this pass
- for now, report-builder behavior should be inferred from the official feature page plus live UI and bundle routes
