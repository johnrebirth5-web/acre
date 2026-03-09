# Brokermint Architecture Blueprint

This document is a technical decomposition of the observed system for building an original back-office platform with similar product scope. It is not a guide for copying proprietary branding, assets, or exact UI.

## 1. Technical Stack

- Delivery model: single-page application at `my.brokermint.com`
- Frontend base: AngularJS
- Angular modules observed:
  - `ngResource`
  - `ngAnimate`
  - `ngRoute`
  - `ngCookies`
  - `ui.sortable`
  - `ui.bootstrap`
  - `textAngular`
  - `checklist-model`
  - `angular-inview`
- Supporting libraries observed:
  - jQuery
  - Bootstrap
  - bootstrap-datepicker
  - daterangepicker
  - Chart.js
  - jsTree
  - clipboard.js
  - moment.js
- Hybrid migration: AngularJS app embeds a growing number of React components.
- Backend inference from routes and responses:
  - Monolith-style app on same origin
  - REST-like endpoints
  - session cookie `_trakitweb2_session`
  - sign-in endpoints such as `/users/sign_in`
  - Heroku response headers

## 2. Rendering and Navigation Model

- Top-level shell is server-driven plus route-driven.
- Menus are loaded from `/menus/:section`.
- `MenuCtrl` switches between:
  - main menu
  - transaction-specific menu
  - buyer-offer menu
  - agent-onboarding menu
  - offer public-share menu
  - eSign/payment gateway/public share special menus
- Current-account and permission state is exposed in global `env`.
- Access is gated by:
  - `env.me`
  - `env.account`
  - `env.account_user`
  - `env.permissions`
  - `env.feature_flags`

## 3. Main Product Domains

### 3.1 Transactions

Core transaction system includes:
- transaction list
- transaction details
- transaction edit
- transaction contacts
- transaction documents
- unsorted documents
- transaction activity
- transaction offers
- transaction shares
- transaction checklists/tasks
- finance subpages

Core routes:
- `/transactions`
- `/transactions/:transaction_id`
- `/transactions/:transaction_id/edit`
- `/transactions/:transaction_id/activity`
- `/transactions/:transaction_id/checklists/:id`
- `/transactions/:transaction_id/contacts`
- `/transactions/:transaction_id/documents/:filter?`
- `/transactions/:transaction_id/unsorted_documents`
- `/transactions/:transaction_id/offers`
- `/transactions/:transaction_id/shares`

Observed resources:
- `TransactionResource -> /transactions/:id/:command`
- `TransactionChecklistResource -> /transactions/:transaction_id/checklists/:id/:command`
- `TaskResource -> /transactions/:transaction_id/checklists/:checklist_id/tasks/:id/:command`
- `TransactionContactsResource -> /transactions/:transaction_id/contacts/:id/:command`
- `TransactionDocumentResource -> /transactions/:transaction_id/documents/:id/:command`
- `TransactionOfferResource -> /transactions/:transaction_id/offers/:id/:command`
- `TransactionSharesResource -> /transactions/:transaction_id/shares/:id/:command`
- `TransactionSharesRecipientsResource -> /transactions/:transaction_id/shares/:transaction_share_id/recipients/:recipient_id/:command`
- `TransactionSearchResource -> /transaction_search`

### 3.2 Contacts

Core routes:
- `/contacts`
- `/contacts/:id`

Observed capabilities:
- list/search contacts
- create/edit/delete contacts
- email/phone/type/source fields
- comments and activity
- billing block on contact detail
- private contact permissions

Observed resources:
- `ContactResource -> /contacts/:id/:command`
- `ContactLookupResource -> /contact_lookup/:command`

### 3.3 Checklists and Tasks

Three checklist families are present:
- transactional checklists
- buyer-offer checklists
- agent-onboarding checklists

Admin routes:
- `/account/checklists`
- `/account/checklists/:id`

Observed resources:
- `AccountChecklistResource`
- `AccountChecklistTasksResource`
- `BuyerOfferChecklistTemplatesResource`
- `BuyerOfferChecklistTemplateTasksResource`
- `AgentOnboardingChecklistTemplatesResource`
- `AgentOnboardingChecklistTemplateTasksResource`
- `MyTaskResource`

### 3.4 Buyer Offers

Routes:
- `/buyer-offers`
- `/transactions/:transaction_id/buyer-offers`
- `/transactions/:transaction_id/buyer-offers/:id`

Observed capabilities:
- buyer-offer list page
- per-transaction buyer-offer records
- buyer-offer participants
- buyer-offer custom fields
- buyer-offer permissions and company-wide visibility

Observed resources:
- `BuyerOfferFieldsResource`
- `BuyerOfferParticipantResource`

### 3.5 Documents and eSignature

Observed features:
- upload documents into transaction
- unsorted documents workflow
- approval workflow
- placeholder/checklist-driven document assignment
- eSignature package creation
- signer roles and signer management
- CDA and trade record signature flows
- restart/cancel/resend signature flows

Routes and endpoints:
- `/approve-documents`
- `/documents/:id/:command`
- `/document_packages/:document_id/:command`
- `/bm_esign/:command`
- `/docusign/:command`
- `/email_documents/:command`

### 3.6 Commissions

Observed layers:
- account commission plans
- transaction commission items
- personal commission plans
- commission tags
- CDA generation
- award distribution changes
- commission finalization

Routes:
- `/account/commissions`
- `/transactions/:transaction_id/finance/commissions`
- `/transactions/:transaction_id/finances`

Observed resources:
- `CommissionPlansResource -> /commissions/account/commission_plans/:id/:command`
- `CommissionTagsResource -> /commissions/account/commission_tags`
- `TransactionCommissionsResource -> /commissions/transactions/:transaction_id/commission_items/:id/:command`
- `TradeRecordReportsResource -> /commissions/transactions/:transaction_id/trade_records/:command`
- `UserCommissionsResource -> /commissions/users/:user_id/:command`
- `UserPersonalCommissionPlanResource -> /commissions/users/:user_id/personal_commission_plans/:command/:item_id`
- `CommissionsOptionsResource -> /commissions/options`

### 3.7 Accounting

Observed navigation:
- chart of accounts
- payment gateways
- ledgers
- general ledger
- agent ledgers
- agent billing
- recurring billing
- financial reports

Routes:
- `/accounting`
- `/accounting/:accounting_section`
- `/accounting/:accounting_section/:id`
- `/billing`
- `/recurring-billing`
- `/recurring-billing/:recurring_billing_section`

Observed accounting path constants:
- `chart-of-accounts`
- `payment-gateways`
- `general-ledger`
- `transaction-ledger`
- `agent-ledger`
- `profit-n-loss`
- `balance-sheet`

Observed resources:
- `AccountingResource -> /accounting/:command`
- `PaymentGatewayResource -> /payment_gateways/:id/:command`
- `ViewSettingsResource -> /view_settings/:id`

### 3.8 Reports

Routes:
- `/reports`
- `/reports/:level`
- `/reports/:level/:id`
- `/reports/:level/:id/:details_type`

Observed capabilities:
- company reports
- personal reports
- custom report definitions
- filter and export
- CSV export
- detail views

Observed resources:
- `ReportResource -> /reports/:id/:command`
- `LegacyReportResource -> /legacy_reports/:id/:command`
- `TransactionReportConstructorResource -> /transaction_reports/:id/:command`
- `AgentReportConstructorResource -> /agent_reports/:id/:command`

### 3.9 Users, Roles, Permissions, Onboarding

Routes:
- `/account/users`
- `/account/users/:id`
- `/agent-onboardings/:agent_onboarding_id`
- `/agent-onboardings/:agent_onboarding_id/tasks/:task_id`

Observed capabilities:
- user directory
- activation/deactivation
- password reset
- avatar upload
- account owner transfer
- permission editing
- commission plan assignment
- account linking across locations
- onboarding templates and execution
- starting values
- deductions/income

Observed resources:
- `AccountUserResource`
- `AgentOnboardingResource`
- `AgentOnboardingChecklistsResource`
- `AgentOnboardingChecklistTasksResource`

### 3.10 Library

Routes:
- `/library`

Observed capabilities:
- company library folders
- private/public access patterns
- eSign template and document selection integration

Observed resources:
- `LibraryResource -> /libraries/:library_identifier/:command`
- `FolioSmartFolderResource`
- `FolioUserResource`

### 3.11 Integrations and Add-ons

Observed add-on routes:
- `/user/add-ons`
- `/user/add-ons/:add_on`
- `/user/add-ons/import/main`
- `/user/add-ons/boomtown/configuration`
- `/user/add-ons/dash/configuration`
- `/user/add-ons/dotloop/configuration`
- `/user/add-ons/dropbox/configuration`
- `/user/add-ons/followupboss/configuration`
- `/user/add-ons/kvcore/configuration`
- `/user/add-ons/mls/configuration`
- `/user/add-ons/remax/configuration`
- `/user/add-ons/bhhs/configuration`

Observed ecosystem:
- Boomtown
- Dash
- Dotloop
- Dropbox
- Follow Up Boss
- kvCORE / BoldTrail
- MLS
- RE/MAX
- BHHS
- QuickBooks
- Google Drive / Sheets / Calendar
- Lofty
- LionDesk

## 4. Account Settings and Admin Data

Settings pages observed in UI and code:
- company info
- users
- checklist templates
- custom fields / list dictionaries
- commission plans
- notifications
- account billing
- payment methods

Field/list dictionaries observed:
- transaction fields
- buyer offer fields
- transaction roles
- transaction types
- user fields
- contact fields
- contact types
- contact lead sources
- document rejection reasons
- email templates
- teams
- commission tags

## 5. Permission Model

Observed permission tree includes:
- transactions
  - create, edit, delete, cancel
  - manage all company transactions
  - manage checklist tasks
  - add/remove checklists
  - close and reopen
  - move transactions
  - edit earnest money
  - view/edit/finalize commissions
  - generate CDA
  - change award distribution
  - share transactions
- buyer offers
  - access, create, edit, delete
  - manage all company buyer offers
- pipeline
- reports
  - personal
  - company
- contacts
  - access private contacts
  - manage private contacts
- activity log
- library
  - manage library
  - access all private folders
- approvals
  - approve documents
  - second-level approve documents
  - submit transactions/documents for approval
- company settings
  - company info
  - users
  - checklist templates
  - lists/fields
  - commission plans
  - dashboard
- accounting
  - access accounting
  - manage agent billing
  - manage recurring charges

This implies the system is permission-first, not just role-first.

## 6. React Islands Observed

React components embedded in the Angular app include:
- `BmTransactionSidePanel`
- `BmTransactionFinancesPage`
- `BmTransactionLedgerPage`
- `BuyerOfferListPage`
- `BuyerOfferPage`
- `ChartOfAccountsPage`
- `GeneralLedgerPage`
- `AgentLedgerPage`
- `PaymentGatewaysPage`
- `RecurringBillingSettingsPage`
- `RecurringBillingChargesPage`
- `CompanyLibraryPage`
- `MyTasksPage`
- `CommentTextView`
- `SignatureControl`
- `DocumentPackageEditor`
- `DocumentPreview`
- `ConnectBankAccountPage`

This suggests a gradual strangler migration from AngularJS to React rather than a full rewrite.

## 7. Direct UI Observations From Logged-In Session

Observed account-specific menu structure:
- Overview
  - Dashboard
  - Pipeline
  - Transactions
  - Contacts
  - Reports
  - Activity
  - Library
  - Accounting
- To Do
  - Approve docs
  - Task list
- Settings
  - Company
  - Users
  - Checklists
  - Fields
  - Commission plans
- User
  - Notifications
  - Account
  - Billing

Observed examples of content:
- Dashboard contains goal tracking, weekly updates, link widgets, training resources.
- Pipeline contains status buckets and office net totals.
- Transactions page contains searchable list and create transaction action.
- Contacts page contains searchable list plus detail side panel.
- Reports page supports custom reports, filters, and export.
- Activity page shows account event log.
- Library page organizes folders.
- Accounting page exposes chart of accounts and ledgers.
- Company page includes office info and eSign settings.
- Users page includes onboarding, permissions, commission plans, and financial settings.

## 8. Additional Hidden or Secondary Modules Confirmed In Logged-In Session

These were not all exposed as primary left-nav items, but they are real pages for the current account.

### Multi-account switcher

Route:
- `/user/accounts`

Observed behavior:
- current user can switch between multiple companies
- current session showed three accounts:
  - Acre NY Realty Inc
  - Acre NJ LLC
  - Acre NY Rentals LLC
- each account card shows account number and role

### Add-ons marketplace

Route:
- `/user/add-ons`

Observed categories:
- All
- CRM
- Accounting
- Data
- Business essentials

Observed add-ons from live page plus bundle:
- BoldTrail / kvCORE integration
- btPRO integration
- Follow Up Boss
- LionDesk
- Commissions Inc
- Lofty
- QuickBooks Online
- QuickBooks Desktop
- API
- Dropbox
- MLS
- Google Sheets
- Google Drive
- Google Calendar
- Mailchimp
- RE/MAX
- BHHS
- Dash
- Dotloop
- RateMyAgent
- Boomtown
- White label

### MLS configuration

Routes:
- `/user/add-ons/mls/configuration`
- `/mls`

Observed behavior:
- both routes currently surfaced the MLS configuration screen
- settings observed:
  - search active listings on demand
  - load my listings as incoming transactions

### Personal billing

Route:
- `/billing`

Observed behavior:
- user-level billing page
- sections:
  - statements
  - transaction history

### Recurring billing

Route:
- `/recurring-billing`

Observed behavior:
- redirects into recurring billing charges area
- left subnavigation showed:
  - agent billing
  - recurring charges
  - settings

### Accounting secondary pages

Routes confirmed live:
- `/accounting/general-ledger`
- `/accounting/agent-ledger`
- `/accounting/payment-gateways`

Observed behavior:
- general ledger page supports filters and export
- agent ledger page shows per-agent balances
- payment gateways page supports connecting gateways

### Franchise / enterprise integrations

Routes observed:
- `/remax`
- `/remax/accounts`
- `/remax/users`
- `/bhhs`
- `/dash`

Observed behavior:
- `remax` and `bhhs` pages load branded shells with loading state
- `remax/accounts` and `remax/users` for this account redirected/fell back to transactions
- `dash` route loaded a dedicated shell and appeared to wait on integration data

Inference:
- these modules are real, but current account likely lacks the required franchise entitlement or configuration state for full access

## 9. Feature Flags and Availability

Observed gating patterns:
- accounting depends on `feature_flags.accounting.enabled`
- pipeline depends on `permissions.pipeline`
- dashboard editing depends on `permissions.manage_dashboard`
- buyer offers depend on `permissions.access_buyer_offers`
- document approval depends on `permissions.approve_documents`
- company reports depend on `permissions.access_company_reports`

Therefore the original product is assembled from:
- feature flags
- subscription/package plan state
- permissions
- account state such as trial/suspension
- integration toggles

## 10. Practical Rebuild Outline

For an original implementation, the cleanest decomposition would be:

1. Core shell
- auth
- current account context
- permission service
- menu service
- route guards

2. Transactions bounded context
- transactions
- participants
- status workflow
- checklists/tasks
- documents
- offers
- shares
- search

3. Back-office finance context
- commission rules
- commission items
- CDA/trade record outputs
- ledgers
- chart of accounts
- payment gateways
- recurring billing

4. CRM/context entities
- contacts
- users
- teams
- custom fields
- notifications

5. Content and document context
- library
- document packages
- eSignature
- approvals

6. Reporting context
- saved report definitions
- tabular export
- company/personal scopes

7. Integration context
- adapter per external system
- import jobs
- sync history
- credential/configuration store

## 11. Highest-Value Next Research Steps

If continuing, the next most useful reverse-engineering tasks are:

1. Extract command variants on each resource.
- Example: `update`, `options`, `activate`, `assign_commission_plans`, `accept`, `finish_review`.

2. Reconstruct core DTO shapes.
- Transaction
- Contact
- User
- Checklist template
- Task
- Commission item
- Ledger account
- Report definition

3. Map each UI page to backend resources and permission checks.

4. Design an original information architecture and component system.
- Similar task coverage
- Different visual identity and implementation details

## 12. Key Command Surface Observed

These are especially useful for designing original service contracts.

### Account user

`AccountUserResource`
- `PUT update`
- `POST activate`
- `POST deactivate`
- `POST add_avatar`
- `GET options`
- `GET check_email_availability`
- `POST resend_welcome`
- `GET load`
- `POST set_as_account_owner`
- `POST reset_password`
- `POST update_permissions`
- `POST assign_commission_plans`
- `POST connect_to_accounts`
- `POST disconnect_from_accounts`

### Account

`AccountResource`
- `PUT update`
- `PATCH update_attach_esign_certificate_on_completion`
- `POST create`
- `POST create_sub_account`
- `GET wizard_options`
- `GET options`
- `POST add_logo`
- `POST purchase_subscription`
- `PATCH update_cda_data`
- `PATCH update_domain`
- `POST reinstate`
- `GET show_with_sub_accounts`
- `GET get_sub_account_creation_status`
- `POST toggle_support_package_plan`

### Dashboard

`DashboardResource`
- `GET get`
- `GET status`
- `POST add_widget`
- `POST delete_widget`
- `POST update_widget`

### Reports

`ReportResource`
- `GET available_reports`
- `GET view_options`
- `POST update_view_options`
- `POST data`
- `POST filters`

### Approvals

`ApproveDocumentsResource`
- `POST add_comment_update_status`
- `POST finish_review`
- `GET transactions`
- `GET transaction`
- `GET options`

### eSignature

`BmEsignResource`
- `POST document_package_signature_request`
- `POST send_cda_signature_request`
- `POST send_signature_email`
- `POST resend_signature_email`
- `POST update_signer_email`
- `POST create_draft_from_request`
- `POST cancel_document_esignature`
- `POST toggle_esign_signatures`

### Accounting

`AccountingResource`
- `POST enable_unified_coa`
- `POST disable_unified_coa`

### Transactions

`TransactionResource`
- `GET request_backup`
- `GET download_backup_link`
- `GET issues`
- `GET convert_to_incoming_transaction`

Additional transaction-related commands observed elsewhere:
- `TransactionChecklistResource.attach_checklists -> POST batch_add`
- `ContactResource.matchOrCreate -> POST match_or_create`
- subscription flow includes `prepare_esign_contract` and `send_contract_for_esign`

## 13. DTO Hints Observed

Observed field/group names strongly suggest these model structures:

### Transaction-like DTO

Likely contains:
- core identity and status
- address / transaction name
- owner person
- `commission_items`
- `commission_contacts`
- `documents`
- `documentsByChecklist`
- `selectedDocuments`
- checklist/template attachments

### Account DTO

Observed attributes include:
- company name and address fields
- logo metadata
- domain
- locale
- package plan
- trial/suspension state
- MFA toggle
- `transaction_fields`
- accounting mode such as `unified_coa`
- eSign flags

### User DTO

Observed attributes include:
- profile fields
- role
- team
- permissions map
- commission plans
- commission starting values
- personal deductions/income

### Environment/bootstrap DTO

Global `env` appears to carry:
- `me`
- `account`
- `account_user`
- `permissions`
- `feature_flags`
- package/account state used for route guards and menu visibility
