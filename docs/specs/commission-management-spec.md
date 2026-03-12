# Commission Management Spec

## Goal

Provide a durable commission automation MVP inside Back Office, covering plans, assignments, rules, persisted calculations, and statement/payout-ready visibility.

## Current implemented foundation

- commission plans exist
- assignments exist for:
  - agents
  - teams
- precedence is explicit:
  - direct agent assignment overrides team assignment
  - team assignment applies when no active direct assignment exists
- plan rules support:
  - base split
  - brokerage fee
  - referral fee
  - flat fee deduction
  - sliding scale
- transaction-level calculations are persisted
- transaction detail has a commission section
- accounting has a commission management area
- agent profile shows commission summary
- internal statuses include:
  - draft
  - calculated
  - reviewed
  - statement_ready
  - payable
  - paid

## Current gaps

- no ACH / bank transfer execution
- no payroll / tax workflow
- no full enterprise rule engine
- statement generation is still MVP-level

## Future direction

- strengthen accounting bridge for payable items
- deepen statement snapshots and payout workflow
- expand commission summary/report outputs without redesigning the foundation
