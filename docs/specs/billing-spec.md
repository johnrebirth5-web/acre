# Billing Spec

## Goal

Provide a real self-service `/office/billing` page for the current signed-in Office membership, reusing the existing agent billing and accounting foundation as the only billing source of truth.

## Implemented scope

- `/office/billing` exists as a real Office route
- scope is fixed to the current signed-in membership
- data comes from:
  - `AccountingTransaction`
  - `AccountingTransactionApplication`
  - `AgentRecurringChargeRule`
  - `AgentPaymentMethod`
  - `AuditLog`
- page sections include:
  - billing summary
  - outstanding balance
  - open / pending charges
  - billing ledger
  - recent payments
  - credits / adjustments
  - statements
  - payment methods
  - recent billing activity

## Current behavior

- outstanding balance is derived from open agent-billing invoices after real payment / credit applications
- pending charges include:
  - future-dated or draft billing invoices
  - future recurring rules that do not already have a matching pending invoice in the same period
- recent payments are derived from real `received_payment` accounting transactions
- credit balance is derived from unapplied `credit_memo` remaining amounts
- statements are live-generated monthly summaries from the current billing ledger
  - period
  - generated-at label
  - total charges
  - total payments
  - total credits
  - current remaining balance for invoice rows in that period
- payment methods remain a masked internal foundation only
  - type
  - label
  - provider
  - masked last4
  - default state
  - auto-pay flag
  - status

## Self-service actions

- current membership can add a masked payment-method reference
- current membership can update its own stored payment-method reference
- current membership can remove its own stored payment-method reference
- these actions reuse the existing `AgentPaymentMethod` write path and continue writing into `AuditLog`
- self-service routes do not allow editing another membership's payment methods

## Honest limitations

- no live payment gateway
- no ACH execution
- no self-service pay-now checkout
- no statement PDF generation
- no email / SMS billing delivery
- statements are on-screen live summaries, not durable statement snapshots
- payment methods do not store raw card or bank credentials

## Follow-up work

- add durable statement snapshots only when statement finalization / export becomes a real workflow
- add billing-specific notifications only when real inbox notification types exist
- revisit self-service payment actions only if a real processor or settlement flow is implemented
