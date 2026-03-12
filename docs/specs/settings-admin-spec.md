# Settings / Admin Spec

## Goal

Provide a practical Back Office admin/settings area for access management, teams, field requirements, and checklist templates.

## Current implemented foundation

- routes exist:
  - `/office/settings`
  - `/office/settings/users`
  - `/office/settings/teams`
  - `/office/settings/fields`
  - `/office/settings/checklists`
- users admin supports:
  - role update
  - activate/deactivate
  - office access within current membership model
- teams admin supports:
  - create
  - rename
  - activate/deactivate
  - add/remove members
- fields admin supports:
  - required contact roles
  - transaction field required / visible settings
- checklist template admin supports:
  - create/edit
  - activate/deactivate
  - task rows

## Current gaps

- no generic no-code schema builder
- office access is still bounded by current membership model, not a full ACL matrix
- checklist templates are managed but not fully auto-applied everywhere

## Future direction

- stronger office/user access controls
- richer template application behavior
- broader settings coverage for future workflow modules
