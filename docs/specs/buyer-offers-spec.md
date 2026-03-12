# Buyer Offers Spec

## Goal

Provide a real Back Office buyer-offer workflow inside transaction management, so offers can be tracked, compared, discussed, documented, and clearly integrated into the transaction hub.

## Current implemented foundation

- buyer offers currently live inside the transaction hub rather than as a detached product
- transaction detail has a real `Offers` section
- offer records are stored in the database
- current offer status vocabulary includes:
  - `draft`
  - `submitted`
  - `received`
  - `under_review`
  - `countered`
  - `accepted`
  - `rejected`
  - `withdrawn`
  - `expired`
- current workflow supports:
  - create offer
  - edit offer
  - explicit status transitions
  - compare multiple offers on the same transaction
  - internal offer comments
- offers can currently link to the existing transaction workflow foundation:
  - documents
  - forms
  - signature requests
- accepted offers can explicitly write back key transaction context such as:
  - transaction price
  - closing date
  - acceptance date/context
- offer actions write to the current `Activity Log`

## Current gaps

- there is no MLS ingestion
- there is no email ingestion or external offer inbox
- there is no client-facing offer portal
- there is no external messaging / signature vendor workflow beyond the internal foundation
- there is no separate global `/office/offers` workspace yet

## Future direction

- keep buyer offers anchored inside transaction management unless a true office-wide offers queue becomes operationally necessary
- strengthen comparison and decision-making visibility for listing-side workflows
- add inbound offer ingestion only when a real source exists
- continue reusing the current documents / forms / signatures foundation rather than creating an isolated offer subsystem
