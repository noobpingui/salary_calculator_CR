# ADR-0001 — Represent money as integer cents (`bigint`) in the domain

- **Status:** Proposed
- **Date:** 2026-09-27
- **Feature:** [001-net-salary](../../specs/001-net-salary/plan.md)

## Context

The net salary calculation (spec 001) must round each deduction to 2 decimals with round half up, "unaffected by
binary floating-point representation errors" (REQ-005), and `net + total deductions` must equal the gross salary
exactly to the cent (AC-004.7). Binary `number` arithmetic cannot guarantee these rules: values such as `0.165`
(AC-005.1) or `1.005` have no exact binary representation, so rounding a floating-point product can yield `0.16`
instead of `0.17`, and sums of rounded floats can drift by a cent. The spec also
sets no upper limit on the gross salary other than being finite (Q6), so products like `grossCents * rate` can
exceed `Number.MAX_SAFE_INTEGER`.

## Decision

- Inside `src/domain/`, every money amount is an integer number of **cents** typed as `bigint`
  (`type Cents = bigint`).
- The gross salary is parsed **from the input string** straight into cents, never through a floating-point
  `number`.
- Legal rates are integer **basis points** (1 bp = 0.01 %; 5.50 % = 550 bp). A percentage is applied as
  `grossCents * bp`, and the result is divided by 10 000 with explicit round half up
  (`(n + 5000n) / 10000n` for `n >= 0`).
- Conversion to `number` only happens at the presentation boundary, to call `formatCRC`, which stays the only
  currency formatter (Art. P2.3).

## Consequences

- Rounding and totals are exact for any finite input; no `toFixed`/`Math.round` rounding of floats.
- Tests compare `bigint` literals (e.g. `5_500_000n` for ₡55,000.00), which is more verbose but unambiguous.
- `bigint` values cannot be mixed with `number` without explicit conversion. The type checker enforces the
  boundary, and `JSON.stringify` does not serialize them (not needed: nothing is persisted, Art. P3.1).
- For amounts above about 9e13 colones, the `number` conversion used only for display may lose cents. The
  computed values stay exact.
