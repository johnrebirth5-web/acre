# Task List Spec

## Goal

Provide a real Back Office task list for transaction workflow, approvals, compliance, and operational follow-up.

## Current implemented foundation

- `/office/tasks` exists and is database-backed
- `/office/approve-docs` now exists as the dedicated reviewer queue for document-linked task approvals
- built-in views:
  - `Requires attention`
  - `All transactions`
- document approval queue views now include:
  - `All open review items`
  - `Awaiting my review`
  - `Awaiting second review`
  - `Rejected`
  - `Waiting for signatures`
  - `Missing required document`
- personal saved views exist
- tasks support:
  - create / edit
  - complete / reopen
  - request review
  - approve / reject
  - secondary approval
- task workflow can reflect:
  - pending upload
  - uploaded / not submitted
  - review requested
  - second review requested
  - approved
  - rejected
  - waiting for signatures
  - fully signed
  - complete
  - reopened

## Current gaps

- no reminder delivery system
- no reviewer assignment / SLA model beyond the current permission-based queue
- checklist template auto-application is still limited
- no complex BPM/workflow engine

## Future direction

- strengthen checklist application from admin templates
- improve reviewer load balancing and bottleneck visibility
- add stronger alerting/reminder workflows without duplicating task state
