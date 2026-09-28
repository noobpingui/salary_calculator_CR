# ADR-0002 — Opt-in DOM test environment (jsdom + Testing Library) for page behavior

- **Status:** Proposed
- **Date:** 2026-09-27
- **Feature:** [002-ui-redesign](../../specs/002-ui-redesign/plan.md)

## Context

Up to feature 001, every test ran in Vitest's `node` environment (Art. P1.3). UI behavior was covered only through
the pure presenter and static source checks. Feature 002 adds behavior that exists only in the rendered page: live
recalculation on `input` events, Enter-to-submit, Tab order, `aria-invalid`, `role="alert"` and the empty state. The
approved spec (Q9) asks for these `[DOM]` acceptance criteria to be automated. Art. P1.3 allows a DOM environment
only through an explicit task in `plan.md`, and Art. B4.3 requires a test for every AC.

Options considered:
- **happy-dom:** fast, but less complete for implicit form submission and focus handling, and it has had recent
  sandbox-escape advisories.
- **jsdom:** slower, but the most standards-complete DOM for Node and the reference target of Testing Library.
- **Real browser (Playwright / Vitest browser mode):** the only option that computes layout, but it needs browser
  binaries, a heavier setup and more CI time for a single layout check (AC-N003.2).

## Decision

- Add `jsdom`, `@testing-library/dom` and `@testing-library/user-event` as `devDependencies`.
- The default Vitest environment stays `node` (`vite.config.ts` is unchanged). A test file opts in to the DOM with the
  docblock `// @vitest-environment jsdom` on its first line.
- DOM tests live under `tests/dom/` and only there. Unit tests (`tests/unit/`) stay DOM-free, as P1.3 requires.
- DOM tests exercise the real entry point: they create `<div id="app"></div>`, call `vi.resetModules()` and
  dynamically import `src/main.ts`. User actions go through `userEvent` (typing, clearing, Enter, Tab) and queries use
  roles and labels. `vi.mock` is not used (Art. P1.4).
- Layout (pixel widths, scrolling) is **not** asserted in jsdom, because jsdom has no layout engine. Layout
  requirements are covered by static stylesheet checks plus a documented manual check.

## Consequences

- `[DOM]` ACs have real automated tests that run with `npm test` and need no browser binaries or network.
- Three new dev dependencies to keep updated. No production bundle impact.
- The rule "tests do not depend on `document`/`window`" now applies to `tests/unit/`. `tests/dom/` is the documented
  exception. If Part II P1.3 is reworded later, it must be done through an ADR, as Part II requires.
- If a future feature needs real layout assertions, adopting Vitest browser mode or Playwright needs a new ADR.
