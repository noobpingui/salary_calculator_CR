# ADR-0003 — Monochrome design tokens in one stylesheet, checked by static audits

- **Status:** Proposed
- **Date:** 2026-09-27
- **Feature:** [002-ui-redesign](../../specs/002-ui-redesign/plan.md)

## Context

Spec 002 requires a strictly achromatic palette in light and dark schemes (REQ-001, REQ-009), WCAG AA contrast
(AC-N002.3), system fonts only (AC-N001.3), motion of at most 300 ms (AC-008.1) and a reduced-motion override
(AC-N002.2). These rules are `[static]`: tests read the stylesheet and the markup as text. With free-form CSS, a
regex-based check is brittle (hex-like ids, colors hidden in shorthands, `var()` indirection). Vite already brings
`postcss` in as a transitive dependency.

## Decision

- `src/style.css` stays the only stylesheet. Colors, font stacks, type sizes and motion durations are declared as
  **custom properties (tokens)**:
  - light values in the top-level `:root` rule;
  - dark values in `@media (prefers-color-scheme: dark) { :root { ... } }`, which redefines **only** color tokens.
- **Color literals** may only appear as values of `--color-*` tokens in those two blocks. Every other declaration
  uses `var(--color-*)`, `currentColor` or `transparent`. Markup (`index.html`, the template in `src/main.ts`) has no
  `style` attributes. The only color literals in markup are the `theme-color` meta values.
- Token names never contain a CSS named color (for example `--color-ink`, not `--color-tan`).
- Add `postcss` as an explicit `devDependency`. Static tests parse `src/style.css` with it (rules, at-rules,
  declarations) and resolve `var(--token)` against the `:root` blocks. A small test-support module
  (`tests/support/css-audit.ts`) holds the parsing and color helpers (achromatic check, WCAG relative luminance
  and contrast ratio).

## Consequences

- Palette, contrast, font and motion rules are enforced by `npm test` for every future style change, in both schemes.
- Changing the palette means editing one pair of token blocks. The contrast test recomputes the declared pairs.
- Authors must follow the token convention. A literal color outside a token block fails the audit even if it is
  grey. This is intended, because it keeps both schemes in sync.
- `postcss` is a test-only dependency with no bundle impact. Its version should stay aligned with the one Vite uses.
