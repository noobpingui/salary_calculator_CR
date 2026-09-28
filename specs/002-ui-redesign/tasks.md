# Tasks 002 — Minimalist, dynamic, monochrome calculator UI

- **Plan:** [plan.md](plan.md) (approved 2026-09-27, commit `7f1c765`; ADR-0002, ADR-0003 accepted)
- **Scopes:** `app`

## Phase A0 — Environment setup and scaffolding (implementer)
<!-- Step 0 (config) must land before Phase A's DOM test task, per plan §5 and Art. P1.3/B5.2: the red check must
     fail on missing behavior, not on missing packages or an undeclared jsdom environment. -->
- [x] T-001 [REQ-003, REQ-004, REQ-005, REQ-007] (config) Add `jsdom`, `@testing-library/dom`, `@testing-library/user-event` and `postcss` as devDependencies (update the lockfile with `npm install`) and create the empty `tests/dom/` directory for opt-in DOM tests; `vite.config.ts` keeps `environment: 'node'` — `package.json`
- [x] T-002 [REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008] (scaffold) Create `src/ui/result-area-view.ts` with the real `EMPTY_STATE_HINT` constant, the `EvaluationMode`, `ResultAreaView`, `ResultAreaKind` and `BreakdownLineRole` types, and the `presentResultArea`, `breakdownLineRole`, `isFieldInvalid` and `shouldRevealResult` signatures from plan §3.2, each throwing `new Error('not implemented')` — `src/ui/result-area-view.ts`

## Phase A — Tests (test-author)

### `tests/unit/result-area-view.test.ts` (node)
- [x] T-003 [REQ-002, AC-002.1] (test) `presentResultArea` reproduces the 001 breakdown, labels, order and legal-year note for a valid gross salary, in both `live` and `submit` modes — `tests/unit/result-area-view.test.ts`
- [x] T-004 [REQ-002, AC-002.2] (test) `presentResultArea` reproduces the 001 error messages for empty, non-numeric, negative and over-precision inputs — `tests/unit/result-area-view.test.ts`
- [x] T-005 [REQ-003, AC-003.5] (test) `presentResultArea` returns the same breakdown or error for the same non-empty input regardless of evaluation mode — `tests/unit/result-area-view.test.ts`
- [x] T-006 [REQ-005, AC-005.2] (test) `presentResultArea` returns the empty state for an empty or whitespace-only input evaluated `live` — `tests/unit/result-area-view.test.ts`
- [x] T-007 [REQ-005, AC-005.3] (test) `presentResultArea` returns the 001 empty-value error for an empty or whitespace-only input evaluated as `submit` — `tests/unit/result-area-view.test.ts`
- [x] T-008 [REQ-006, AC-006.2] (test) `presentResultArea` returns exactly seven breakdown lines with "Salario neto" last and no added sign or prefix — `tests/unit/result-area-view.test.ts`
- [x] T-009 [REQ-006] (test) `breakdownLineRole` maps the first, last, second-to-last and a middle index to `gross`, `net`, `total` and `deduction` — `tests/unit/result-area-view.test.ts`
- [x] T-010 [REQ-007] (test) `isFieldInvalid` returns `true` only when the view kind is `error` — `tests/unit/result-area-view.test.ts`
- [x] T-011 [REQ-008] (test) `shouldRevealResult` returns `true` only when the result-area kind changes, and stays `false` across repeated `result` updates — `tests/unit/result-area-view.test.ts`
- [x] T-012 [NFR-001, AC-N001.1] (test) producing a result through `presentResultArea` calls no stubbed network or storage global (same pattern as `privacy.test.ts`) — `tests/unit/result-area-view.test.ts`

### `tests/unit/style-audit.test.ts` (node) and its support helper
- [x] T-013 [REQ-001] (test) create the test support helper with `postcss` parsing, per-scheme `:root` token resolution, `isAchromatic`, `relativeLuminance`/`contrastRatio` and duration parsing — `tests/support/css-audit.ts`
- [x] T-014 [REQ-001, AC-001.1] (test) every color value declared in the stylesheet, and in the markup `src/main.ts` produces, resolves to an achromatic value in both color schemes — `tests/unit/style-audit.test.ts`
- [x] T-015 [REQ-001, AC-001.2] (test) the error-message rules use an achromatic color and the stylesheet source contains no `#b00020` — `tests/unit/style-audit.test.ts`
- [x] T-016 [REQ-001, AC-001.3] (test) the stylesheet uses no chromatic named color keyword (`red`, `green`, `blue`, etc.) as a color value — `tests/unit/style-audit.test.ts`
- [x] T-017 [REQ-006, AC-006.1] (test) the "Salario neto" line's amount has a larger font size and at least as heavy a font weight as any other breakdown line, at base size and inside the `min-width` media query — `tests/unit/style-audit.test.ts`
- [x] T-018 [REQ-006, AC-006.3] (test) "Total de rebajas" and "Salario neto" are separated from the lines above them by a visible achromatic divider or spacing rule — `tests/unit/style-audit.test.ts`
- [x] T-019 [REQ-008, AC-008.1] (test) no transition or animation duration plus delay, after `var()` resolution, exceeds 300ms anywhere in the stylesheet — `tests/unit/style-audit.test.ts`
- [x] T-020 [REQ-008, AC-008.2] (test) at least one transition or animation applies to the result area, and at least one to the field/button hover or focus state — `tests/unit/style-audit.test.ts`
- [x] T-021 [REQ-009, AC-009.1] (test) the stylesheet defines a light scheme and a dark scheme selected by the `prefers-color-scheme` preference, and every color token in both is achromatic — `tests/unit/style-audit.test.ts`
- [x] T-022 [NFR-001, AC-N001.2] (test) the stylesheet contains no `http://`/`https://`/`//` URL and no remote `@import` — `tests/unit/style-audit.test.ts`
- [x] T-023 [NFR-001, AC-N001.3] (test) the stylesheet declares only system font families (the plan's allowlist) and no `@font-face` rule — `tests/unit/style-audit.test.ts`
- [x] T-024 [NFR-002, AC-N002.1] (test) the field and "Calcular" button each have a visible achromatic `:focus-visible` indicator, and no rule sets `outline: none` without replacing it — `tests/unit/style-audit.test.ts`
- [x] T-025 [NFR-002, AC-N002.2] (test) a `prefers-reduced-motion: reduce` rule sets every transition and animation duration to `none` or `0` for the whole page — `tests/unit/style-audit.test.ts`
- [x] T-026 [NFR-002, AC-N002.3] (test) the resolved normal-text, large-text and border/focus color pairs meet WCAG 2.2 AA contrast (4.5:1, 3:1, 3:1) in both schemes — `tests/unit/style-audit.test.ts`
- [x] T-027 [NFR-003, AC-N003.1] (test) the field and "Calcular" button have a minimum height of at least 44px (2.75rem at the default root size) — `tests/unit/style-audit.test.ts`
- [x] T-028 [NFR-003, AC-N003.2] (test) static layout proxy: the breakdown grid columns, label wrapping (`overflow-wrap: anywhere`, no forced `nowrap` on `dt`), the absence of fixed widths above 18rem, and the base `--text-net` size are consistent with fitting the 320px viewport (per plan §5; complemented by the manual check the verifier performs and records in `verify-report.md`, not by an automated task) — `tests/unit/style-audit.test.ts`

### `tests/unit/markup-audit.test.ts` (node)
- [x] T-029 [REQ-001, AC-001.1] (test) the markup `src/main.ts` produces and `index.html` have no `style` attribute and no `.style.` usage, and the `theme-color` meta values are achromatic — `tests/unit/markup-audit.test.ts`
- [x] T-030 [REQ-001, AC-001.2] (test) `#b00020` does not appear anywhere under `src/**` or in `index.html` — `tests/unit/markup-audit.test.ts`
- [x] T-031 [REQ-009, AC-009.2] (test) the page source has no control to switch color schemes and no `localStorage`/`sessionStorage`/cookie reference storing a scheme preference — `tests/unit/markup-audit.test.ts`
- [x] T-032 [NFR-001, AC-N001.2] (test) `index.html` and the markup `src/main.ts` produces contain no `http://`/`https://`/`//` URL — `tests/unit/markup-audit.test.ts`
- [x] T-033 [NFR-002, AC-N002.4] (test) the document language stays `es-CR`, the field keeps its visible label "Salario bruto mensual (CRC)", and the result area stays a polite live region — `tests/unit/markup-audit.test.ts`

### `tests/unit/regression-001.test.ts` (node)
- [x] T-034 [REQ-002, AC-002.3] (test) every existing 001 test file under `tests/unit/` still contains its 001 `SDD:` markers and no `.skip`/`.only`/`.todo` after this feature — `tests/unit/regression-001.test.ts`

### `tests/dom/salary-form.test.ts` (jsdom, opt-in per ADR-0002)
- [x] T-035 [REQ-003, AC-003.1] (test) typing a valid value into the empty field shows the matching breakdown live, without submitting — `tests/dom/salary-form.test.ts`
- [x] T-036 [REQ-003, AC-003.2] (test) editing a shown breakdown's value replaces it fully with the new breakdown, with no leftover amount from the previous value — `tests/dom/salary-form.test.ts`
- [x] T-037 [REQ-003, AC-003.3] (test) typing a non-empty invalid value live shows the matching 001 error and no breakdown — `tests/dom/salary-form.test.ts`
- [x] T-038 [REQ-003, AC-003.4] (test) clearing the field completely while typing returns the result area to the empty state with no error message — `tests/dom/salary-form.test.ts`
- [x] T-039 [REQ-004, AC-004.1] (test) activating "Calcular" with an empty field shows the empty-value error and no breakdown — `tests/dom/salary-form.test.ts`
- [x] T-040 [REQ-004, AC-004.2] (test) pressing Enter in the field with a valid value shows the matching breakdown — `tests/dom/salary-form.test.ts`
- [x] T-041 [REQ-004, AC-004.3] (test) tabbing from page load moves focus to the field then the "Calcular" button, in that order — `tests/dom/salary-form.test.ts`
- [x] T-042 [REQ-005, AC-005.1] (test) on page load, before typing anything, the result area shows the empty-state hint and no error message — `tests/dom/salary-form.test.ts`
- [x] T-043 [REQ-007, AC-007.1] (test) an invalid value marks the field invalid for assistive technologies and exposes the matching message as an alert — `tests/dom/salary-form.test.ts`
- [x] T-044 [REQ-007, AC-007.2] (test) fixing an invalid value to a valid one removes the invalid field state and the error message — `tests/dom/salary-form.test.ts`
- [x] T-045 [REQ-007, AC-007.3] (test) the error element's text content is exactly the 001 message, with no added characters — `tests/dom/salary-form.test.ts`

## Phase B — Implementation (implementer)
<!-- Dependency order: UI view logic (pure, no DOM) -> stylesheet tokens/rules -> markup metas -> entry point wiring
     that consumes both. Each impl task is done when the (test) tasks covering the same ACs pass. -->

### UI view logic
- [x] T-046 [REQ-002, REQ-003, REQ-004, REQ-005] (impl) implement `presentResultArea`: delegate to `presentNetSalary` and return the empty state only for a blank/whitespace input evaluated `live` (plan §3.3) — `src/ui/result-area-view.ts`
- [x] T-047 [REQ-006, REQ-007, REQ-008] (impl) implement `breakdownLineRole`, `isFieldInvalid` and `shouldRevealResult` per their exact rules in plan §3.3 — `src/ui/result-area-view.ts`

### Styles
- [x] T-048 [REQ-001, REQ-009] (impl) define the achromatic color design tokens in `:root` (light scheme) and redefine only the `--color-*` tokens under `@media (prefers-color-scheme: dark)` — `src/style.css`
- [x] T-049 [REQ-006, REQ-008, NFR-002, NFR-003] (impl) define typography, spacing, motion and touch-target size tokens (`--font-*`, `--text-*`, `--weight-*`, `--space-*`, `--size-target`, `--motion-*`, `--ease-out`) — `src/style.css`
- [x] T-050 [REQ-006] (impl) style the breakdown lines by role (`.line--gross/deduction/total/net`), the "Salario neto" emphasis, and the dividers above "Total de rebajas" and "Salario neto" — `src/style.css`
- [x] T-051 [REQ-001, REQ-007] (impl) style the error state (font weight, left bar, thickened invalid field underline) using only achromatic tokens, with no color-only cue — `src/style.css`
- [x] T-052 [REQ-008] (impl) add the result-area reveal animation and the field/button hover and focus transitions, each at most 300ms — `src/style.css`
- [x] T-053 [NFR-002] (impl) add `:focus-visible` outlines for the field and button and the `prefers-reduced-motion` block that zeroes every transition and animation — `src/style.css`
- [x] T-054 [NFR-003] (impl) add the responsive single-column/two-column layout, the field/button minimum touch-target height, and the label-wrapping/amount-nowrap rules — `src/style.css`

### Markup and entry point
- [x] T-055 [REQ-009] (impl) add the `color-scheme` and achromatic `theme-color` meta tags, with `lang="es-CR"` kept unchanged — `index.html`
- [x] T-056 [REQ-003, REQ-004] (impl) wire the field's `input` listener and the form's `submit` listener (with `preventDefault`) in `src/main.ts` to call `presentResultArea` with the `live`/`submit` mode — `src/main.ts`
- [x] T-057 [REQ-005, REQ-006, REQ-007] (impl) render the empty, error and breakdown states in `src/main.ts` with `data-state`, `line--{role}` classes, `aria-invalid`/`aria-describedby` and `replaceChildren` — `src/main.ts`
- [x] T-058 [REQ-008] (impl) track the previous result-area kind in `src/main.ts` and apply the `reveal` class based on `shouldRevealResult` — `src/main.ts`

## Coverage matrix

| REQ / NFR | AC | Test tasks | Impl tasks |
|---|---|---|---|
| REQ-001 | AC-001.1 | T-014, T-029 | T-048, T-055 |
| REQ-001 | AC-001.2 | T-015, T-030 | T-051 |
| REQ-001 | AC-001.3 | T-016 | T-048 |
| REQ-002 | AC-002.1 | T-003 | T-046, T-057 |
| REQ-002 | AC-002.2 | T-004 | T-046, T-057 |
| REQ-002 | AC-002.3 | T-034 | T-046 (regression; no behavior change) |
| REQ-003 | AC-003.1 | T-035 | T-046, T-056 |
| REQ-003 | AC-003.2 | T-036 | T-056, T-057 |
| REQ-003 | AC-003.3 | T-037 | T-046, T-057 |
| REQ-003 | AC-003.4 | T-038 | T-046, T-057 |
| REQ-003 | AC-003.5 | T-005 | T-046 |
| REQ-004 | AC-004.1 | T-039 | T-056, T-057 |
| REQ-004 | AC-004.2 | T-040 | T-056, T-057 |
| REQ-004 | AC-004.3 | T-041 | T-056 |
| REQ-005 | AC-005.1 | T-042 | T-057 |
| REQ-005 | AC-005.2 | T-006 | T-046 |
| REQ-005 | AC-005.3 | T-007 | T-046 |
| REQ-006 | AC-006.1 | T-017 | T-050 |
| REQ-006 | AC-006.2 | T-008 | T-047, T-057 |
| REQ-006 | AC-006.3 | T-018 | T-050 |
| REQ-007 | AC-007.1 | T-043 | T-047, T-051, T-057 |
| REQ-007 | AC-007.2 | T-044 | T-047, T-057 |
| REQ-007 | AC-007.3 | T-045 | T-057 |
| REQ-008 | AC-008.1 | T-019 | T-052 |
| REQ-008 | AC-008.2 | T-020 | T-052 |
| REQ-009 | AC-009.1 | T-021 | T-048 |
| REQ-009 | AC-009.2 | T-031 | T-048, T-055 (no toggle/storage added) |
| NFR-001 | AC-N001.1 | T-012 | T-046 |
| NFR-001 | AC-N001.2 | T-022, T-032 | T-048, T-055 |
| NFR-001 | AC-N001.3 | T-023 | T-049 |
| NFR-002 | AC-N002.1 | T-024 | T-053 |
| NFR-002 | AC-N002.2 | T-025 | T-053 |
| NFR-002 | AC-N002.3 | T-026 | T-048 |
| NFR-002 | AC-N002.4 | T-033 | T-057 |
| NFR-003 | AC-N003.1 | T-027 | T-049, T-054 |
| NFR-003 | AC-N003.2 | T-028 (static proxy; see note) | T-054 |

**AC-N003.2 note (spec Q9, plan §5):** jsdom has no layout engine, so this AC cannot be driven end-to-end by a
DOM test. It is covered by the automated static proxy test **T-028** (breakdown grid columns, label wrapping,
no fixed width above 18rem, base net-amount size) plus a **manual check** the verifier performs at the `verify`
stage (320×640 viewport, gross salary `5000000`, both color schemes) and records in `verify-report.md`, exactly
as the plan allows. No separate tasks.md task represents the manual check itself, since it is not test-authored
or implemented, it is verified.

Support helper **T-013** (`tests/support/css-audit.ts`) is not itself an AC but is required by every
`style-audit.test.ts` task (T-014–T-028).

**Auxiliary/no-op-preserving tasks not tied to a single AC:** T-001 (config, DOM environment; enables T-035–T-045),
T-002 (scaffold; enables T-003–T-012).

