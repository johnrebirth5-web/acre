# Offer Management Spec

## Goal

Provide a Back Office buyer-offer workflow inside transaction management, including offer tracking, comparison, comments, and linked docs/forms/signatures.

## Current implemented foundation

- offers are stored in the database
- transaction detail has a real offers section
- current status vocabulary includes:
  - draft
  - submitted
  - received
  - under_review
  - countered
  - accepted
  - rejected
  - withdrawn
  - expired
- offer comparison exists
- internal offer comments exist
- documents/forms/signatures can be linked to offers
- accepted offers can explicitly write back key transaction fields

## Current gaps

- no MLS/email ingestion
- no client-facing portal
- no global top-level offers workspace yet
- no external messaging/signature vendor behavior

## Future direction

- add optional office-wide offer queue when operationally useful
- strengthen listing-side workflow parity
- plug in external ingestion only when a real data source exists
