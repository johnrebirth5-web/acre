# Pipeline Phase 2 Spec

## Goal

Evolve `/office/pipeline` into a stronger BoldTrail/Brokermint-style management workspace while keeping real database-backed workflow context and honest metrics.

## Current implemented foundation

- real left-side funnel summary rail with denser live-stage rows
- monthly `Closed / Cancelled` rollups
- top-level workspace summary tied to the current working list
- right-side unified transaction list
- URL-driven filters:
  - side / representing
  - owner
  - search
  - metric mode
- supported metric modes:
  - transaction volume
  - office net
  - office gross
- current selection can reset back to all filtered transactions without losing top-level filters
- right-side rows show title/address, city/state, status, side, owner, price, selected metric, key date, and updated date

## Current gaps

- still lighter than full target-product parity
- drilldown depth is limited
- no automation or drag/drop behavior
- no deeper analytics layers

## Future direction

- improve manager scanning and context summaries
- deepen historical rollups and comparisons
- improve cross-links into transaction work queues
- keep the page as a working pipeline workspace, not a kanban board
