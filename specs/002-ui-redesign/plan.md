# Plan 002 — Minimalist, dynamic, monochrome calculator UI

- **Spec:** [spec.md](spec.md) (approved 2026-09-27, commit `ce9cd20`)
- **Scopes:** `app`

## 1. Solution summary

The calculation (`src/domain/`) and the 001 presenter `presentNetSalary` stay untouched. A new pure module
`src/ui/result-area-view.ts` wraps the presenter with an **evaluation mode** (`live` | `submit`) that adds the empty
state (REQ-003, REQ-004, REQ-005) plus small pure helpers for view decisions (line roles, field invalid state, when to
play the reveal). `src/main.ts` stays a thin entry point (Art. P2.1): it builds the markup, listens to `input` and
`submit`, calls the pure module and renders with `textContent` + `replaceChildren`. `src/style.css` is rewritten
around achromatic design tokens for a light and a dark scheme (ADR-0003). DOM behavior is tested in an opt-in jsdom
environment under `tests/dom/` (ADR-0002); stylesheet and markup rules are checked by static audits in `tests/unit/`.

## 2. Architecture impact

| Scope | Layer / area | New files | Modified files | Reason |
|---|---|---|---|---|
| app | UI view logic (pure) | `src/ui/result-area-view.ts` | — | Live/submit modes, empty state, line roles, invalid state, reveal decision (REQ-003/004/005/006/007/008) |
| app | UI entry point | — | `src/main.ts` | New markup, `input` listener, empty state, `aria-invalid`, line role classes, reveal class (REQ-003..008) |
| app | Styles | — | `src/style.css` | Full rewrite: tokens, light/dark, hierarchy, motion, focus, responsive (REQ-001, 006, 008, 009, NFR-002, NFR-003) |
| app | Markup | — | `index.html` | `color-scheme` and achromatic `theme-color` metas (REQ-009); `lang="es-CR"` kept |
| app | Tooling | — | `package.json`, `package-lock.json` | devDependencies `jsdom`, `@testing-library/dom`, `@testing-library/user-event`, `postcss` (ADR-0002, ADR-0003) |
| app | Tests (node) | `tests/unit/result-area-view.test.ts`, `tests/unit/style-audit.test.ts`, `tests/unit/markup-audit.test.ts`, `tests/unit/regression-001.test.ts` | — | Pure logic and `[static]` ACs |
| app | Tests (jsdom) | `tests/dom/salary-form.test.ts` | — | `[DOM]` ACs |
| app | Test support | `tests/support/css-audit.ts` | — | postcss parsing, `var()` resolution, achromatic check, WCAG contrast (not collected: not `*.test.ts`) |

Unchanged on purpose: `src/domain/**`, `src/shared/format-crc.ts`, `src/ui/net-salary-view.ts`, `vite.config.ts`
(default environment stays `node`), `tsconfig.json`, `eslint.config.js`, and every existing file in `tests/unit/`.

## 3. Design
### 3.1 Data and migrations

Not applicable. Nothing is persisted; no storage, no network (NFR-001, Art. P3.1).

### 3.2 Contracts and interfaces

**New module `src/ui/result-area-view.ts`** (pure, no DOM, runs in `node`). Exact signatures for the skeletons
(Art. P1.6):

```ts
import { CURRENT_LEGAL_PARAMETERS } from '../domain/legal-parameters';
import type { LegalParameters } from '../domain/legal-parameters';
import type { NetSalaryView } from './net-salary-view';

/** Empty-state hint (spec section 6, REQ-005). */
export const EMPTY_STATE_HINT = 'Ingrese su salario bruto mensual para ver el desglose.';

/** `live` = the field changed while typing; `submit` = Enter or "Calcular". */
export type EvaluationMode = 'live' | 'submit';

export type ResultAreaView = NetSalaryView | { readonly kind: 'empty'; readonly hint: string };

export type ResultAreaKind = ResultAreaView['kind']; // 'empty' | 'error' | 'result'

export type BreakdownLineRole = 'gross' | 'deduction' | 'total' | 'net';

export function presentResultArea(
  _rawInput: string,
  _mode: EvaluationMode,
  _params: LegalParameters = CURRENT_LEGAL_PARAMETERS,
): ResultAreaView;

export function breakdownLineRole(_index: number, _lineCount: number): BreakdownLineRole;

export function isFieldInvalid(_view: ResultAreaView): boolean;

export function shouldRevealResult(_previous: ResultAreaKind | null, _next: ResultAreaKind): boolean;
```

`EMPTY_STATE_HINT` is a constant, so its skeleton holds the real value; the four functions throw
`new Error('not implemented')`. Tests call `presentResultArea(raw, mode)` and `presentResultArea(raw, mode, fakeParams)`.

**Unchanged contracts:** `presentNetSalary`, `NetSalaryView`, `BreakdownLine`, `GROSS_SALARY_ERROR_MESSAGES`
(`src/ui/net-salary-view.ts`), `parseGrossSalary`, `calculateNetSalary`, `formatCRC`.

**DOM contract of the page** (what `tests/dom/` and the static audits rely on; built by `src/main.ts`):

| Element | Contract |
|---|---|
| `<input id="gross-salary">` | Visible `<label for="gross-salary">Salario bruto mensual (CRC)</label>`; `type="text"`, `inputmode="decimal"`, `autocomplete="off"`; `aria-invalid="true"` and `aria-describedby="gross-salary-error"` only while an error is shown, both removed otherwise |
| `<button type="submit">Calcular</button>` | The only `<button>` on the page; after the input in DOM and tab order; no `tabindex` anywhere |
| `<section id="result" aria-live="polite">` | Result area; attribute `data-state` = current `ResultAreaKind` |
| Empty state | `<p class="hint">` with `EMPTY_STATE_HINT` |
| Error | `<p id="gross-salary-error" class="error" role="alert">` whose `textContent` is exactly the 001 message |
| Breakdown | `<dl class="breakdown">` containing one `<div class="line line--{role}">` per line (`<dt>` label, `<dd>` amount), in presenter order, then `<p class="legal-year">` |
| Reveal | the single child wrapper of `#result` gets class `reveal` only when `shouldRevealResult` is true |

No `style` attributes, no `innerHTML` with user values (the static template string without user data may keep using
`innerHTML`, as in 001), no scheme toggle, no `matchMedia`, no storage.

### 3.3 Logic

All in `src/ui/result-area-view.ts`; dependencies: `presentNetSalary` (reused, not duplicated),
`parseGrossSalary` only indirectly through it, `CURRENT_LEGAL_PARAMETERS` as default, injected `params` for tests.

- `presentResultArea(raw, mode, params)`: compute `view = presentNetSalary(raw, params)`. If `mode === 'live'` and
  `raw.trim() === ''` return `{ kind: 'empty', hint: EMPTY_STATE_HINT }`; otherwise return `view` unchanged. This
  guarantees AC-003.5 (live and submit share one code path) and AC-005.3 (submit keeps the 001 empty error). The
  `trim()` check matches `parseGrossSalary`'s own emptiness rule.
- `breakdownLineRole(index, count)`: `0 → 'gross'`, `count - 1 → 'net'`, `count - 2 → 'total'`, otherwise
  `'deduction'`. Role by position, because the presenter contract fixes the order (AC-002.1) and must not change.
  Out-of-range indexes throw a `RangeError` (programming error, never user input).
- `isFieldInvalid(view)`: `view.kind === 'error'` (REQ-007).
- `shouldRevealResult(previous, next)`: `previous !== next`. The reveal plays on page load (`null → 'empty'`) and
  when the kind changes (empty ↔ error ↔ result); it does **not** replay on each keystroke while the kind stays
  `result`, so amounts update instantly without flicker and no count-up exists (REQ-008, Q1).

`src/main.ts` (entry point, Art. P2.1): holds `previousKind: ResultAreaKind | null`; on load renders
`presentResultArea(input.value, 'live')`; on `input` renders with `'live'`; on `submit` calls `preventDefault()` and
renders with `'submit'`. Rendering: build nodes with `createElement` + `textContent`, set `data-state`, toggle
`aria-invalid`/`aria-describedby` from `isFieldInvalid`, add `line--{breakdownLineRole(i, n)}`, add `reveal` when
`shouldRevealResult`, then `result.replaceChildren(...)` (keeps the 001 check in `privacy.test.ts`).
Rounding: none added; amounts come already formatted by `formatCRC` through the presenter.

### 3.4 User interface

States of the result area follow spec section 6 exactly (`data-state` = `empty` | `error` | `result`). Copy is the
001 copy plus `EMPTY_STATE_HINT`; nothing else is added (Q11).

**Stylesheet structure (`src/style.css`, ADR-0003):**
1. `:root` (light): `color-scheme: light dark`, all `--color-*` tokens, `--font-*`, `--text-*`, `--weight-*`,
   `--space-*`, `--size-target`, `--motion-*`, `--ease-out`. Color literals appear **only** here and in (2).
2. `@media (prefers-color-scheme: dark) { :root { … } }`: redefines only the `--color-*` tokens.
3. `@media (min-width: 48rem)`: two-column layout and larger `--text-net` / `--text-heading` (token redefinition,
   plain `rem`, no `clamp()`, so the audit can compare sizes deterministically).
4. Element rules: body, heading, form, field, button, result area, `.hint`, `.error`, `.breakdown`, `.line--*`,
   `.legal-year`, `::selection`, `:focus-visible`, `[aria-invalid='true']`, `.reveal` + `@keyframes reveal`.
5. `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important;
   animation: none !important; } }` (AC-N002.2).

**Rules the audits rely on:** `accent-color` and `caret-color` use `var(--color-ink)`; no `outline: none` anywhere;
`:focus-visible` on input and button draws `outline: 2px solid var(--color-ink)` with `outline-offset`; input and
button `min-height: var(--size-target)` (`3rem` ≥ 2.75rem); `.line--total` and `.line--net` have a
`border-top` in `var(--color-ink)` plus `margin-top`; `.line--net dd` has the largest `font-size` and the heaviest
`font-weight` of all `.line` rules; `.error` uses weight + a left bar (`border-inline-start: 3px solid
var(--color-ink)`), no symbol, no generated content; `[aria-invalid='true']` thickens the field underline to 3px ink.
Transitions: field/button `border-color`, `background-color`, `color` over `var(--motion-quick)` (120ms);
`.reveal` animation over `var(--motion-reveal)` (200ms), no delay.

**Responsive (NFR-003):** single column by default; `main` padding `var(--space-4)` (1rem) each side;
`.breakdown` grid `minmax(0, 1fr) auto`; `dt` wraps (`overflow-wrap: anywhere`, `min-width: 0`); `dd` is
`white-space: nowrap` with `font-variant-numeric: tabular-nums`; field `width: 100%`, `min-width: 0`; no fixed
`width`/`min-width` above 18rem anywhere (`max-width` only). From 48rem, `main` (`max-width: 60rem`) becomes a grid
`minmax(14rem, 18rem) minmax(0, 1fr)`: form left, result right. Deduction lines get
`border-inline-start: 1px solid var(--color-rule)` as the subtraction guide. Worst case at 320 px (gross `5000000`): the net amount (13 characters) at `--text-net`
2rem ≈ 230 px inside a 288 px content box, so it fits; deduction amounts are 1rem.

### 3.5 Design plan (frontend-design process)

**Subject and job.** A Costa Rican payslip reduced to its arithmetic: one gross figure goes in, the law takes four
bites out, one net figure comes out. The page's job is to make that subtraction readable in a second, on a phone,
while typing. The brief pins the palette (achromatic only), fonts (system only) and motion (≤ 300 ms, reduced motion
respected); the free axes are type treatment, layout and the single memorable element.

**Color tokens** (5 per scheme; contrast against the scheme's paper in brackets):

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-paper` | `#ffffff` | `#000000` | Page background, text on the net slab and on the button |
| `--color-ink` | `#000000` (21:1) | `#ffffff` (21:1) | Text, rules, focus, field underline when active/invalid, button and net slab fill |
| `--color-graphite` | `#595959` (7.0:1) | `#a6a6a6` (8.6:1) | Secondary text: legal-year note, empty-state hint, field label |
| `--color-rule` | `#767676` (4.5:1) | `#8c8c8c` (6.2:1) | Resting field underline, deduction guide line (≥ 3:1, AC-N002.3) |
| `--color-haze` | `#f2f2f2` | `#1f1f1f` | Hover fill of the field; ink on haze 18.8:1 / 16.5:1 |

Contrast pairs the audit computes (AC-N002.3), per scheme: ink/paper, graphite/paper, graphite/haze (≥ 4.5);
paper/ink (net slab text, button text, ≥ 4.5); ink/haze (≥ 4.5); rule/paper and ink/paper as border and focus
(≥ 3). Button hover uses `--color-graphite` fill with `--color-paper` text (7.0:1 light, 8.6:1 dark).
`index.html` `theme-color` metas: `#ffffff` (light) and `#000000` (dark).

**Type.** One family, the platform's own sans, used as a figure face:
`--font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` (allowlist for
AC-N001.3). All amounts and the field use `font-variant-numeric: tabular-nums lining-nums` so columns of colones
align digit by digit. Scale (classical 12·14·16·18·24·32·48):

| Role | Size | Weight | Notes |
|---|---|---|---|
| Heading `h1` | 1.5rem → 2rem (≥ 48rem) | 700 | tracking `-0.01em`, sentence case as in 001 |
| Field value | 1.5rem | 500 | reads as the figure being entered |
| Field label, legal note, hint | 0.875rem / 1rem | 400–500 | graphite, sentence case, never all caps |
| Deduction lines | 1rem | 400 | label left, amount right |
| Gross, "Total de rebajas" | 1.125rem | 600 | |
| "Salario neto" amount | 2rem → 3rem (≥ 48rem) | 750 | on the inverted slab, always the largest and heaviest |

**Layout concept.** The breakdown is laid out like subtraction done by hand: gross on top, the four deductions
indented behind a thin vertical guide (they come out of the gross), a rule, the deductions subtotal, a heavier rule,
then the result. Text is left-aligned, amounts right-aligned in one tabular column; measure stays under 60ch.

Desktop (≥ 48rem): form column left, ledger right, both top-aligned.
```
 Calculadora de            | Salario bruto                    ₡1 000 000,00
 Salario Neto              |  | CCSS — Seguro de Enf… (5,50 %)     ₡55 000,00
                           |  | CCSS — Invalidez, Ve… (4,33 %)     ₡43 300,00
 Salario bruto mensual     |  | Banco Popular — LPT (1,00 %)       ₡10 000,00
 1000000______________     |  | Impuesto sobre la renta             ₡8 200,00
 [ Calcular ]              | ──────────────────────────────────────────────
                           | Total de rebajas                   ₡116 500,00
                           | ██ Salario neto ████████████████████████████
                           | ██                          ₡883 500,00 ████
                           | Parámetros legales vigentes: 2026
```
320 px: one column, same order; long labels wrap, amounts never wrap.
```
 Calculadora de Salario
 Neto
 Salario bruto mensual (CRC)
 5000000_________________
 [ Calcular              ]
 Salario bruto
                ₡5 000 000,00
 | CCSS — Seguro de
 | Enfermedad y Maternidad
 | (5,50 %)     ₡275 000,00
 | …
 ─────────────────────────
 Total de rebajas  ₡…
 ██ Salario neto █████████
 ██      ₡3 … … ,00 ██████
 Parámetros legales…
```
Empty state: the ledger column shows only the graphite hint in its place. Error state: the message in ink, weight
600, behind a 3px ink bar, and the field underline turns 3px ink.

**Principles.**
1. Structure is arithmetic: every rule or indent on the page means "subtract" or "equals"; nothing decorative.
2. Spend boldness once: the net salary slab (ink fill, paper text) is the only inverted, heavy element.
3. Black is black and white is white; greys only mark secondary information or resting states.
4. Motion answers the user: one 200 ms reveal when the result area changes kind, 120 ms on hover/focus, nothing
   while amounts update, nothing under reduced motion.
5. The field is an instrument: large tabular figures on an underline, not a boxed input in a card.

**Self-review against the brief (revisions made):**
- *Card with soft shadow and 12px radius on a light grey page* (first instinct; the SaaS-card default) → removed.
  The page itself is the paper; radius is 0 except `2px` on the button; no shadows at all. Why: the brief asks for
  minimalism, and a card adds a surface that carries no information.
- *Dark scheme `#111` / `#eee`* (tinted near-black tell) → true `#000` / `#fff`. Why: the brief literally says
  black, grey and white; near-blacks are a default, not a choice.
- *Net salary repeated as a big headline above the breakdown* (the "big number, small label" default) → emphasis in
  place, at the bottom of the arithmetic, as the inverted slab. Why: Q7 forbids duplication, and the result belongs
  where the subtraction ends.
- *Staggered fade-and-slide on each breakdown line* (scattered motion default) → a single reveal of the whole result
  area only when its kind changes. Why: while typing, per-line motion would replay on every keystroke.
- *Uppercase tracked field label and hairline rules everywhere* (template chrome, broadsheet default) → sentence-case
  label from 001; only three rules, each with arithmetic meaning. The em-dash labels ("CCSS — …") look like the
  "WORD — fragment" tell, but they are fixed 001 content and stay unchanged (spec wins).

## 4. REQ → design map

| REQ / NFR | Where it is solved |
|---|---|
| REQ-001 | `src/style.css` color tokens (§3.5), `var()`-only usage, `accent-color`/`caret-color`/`::selection`; no `style` attributes in `src/main.ts`; `index.html` theme-color metas; `.error` loses `#b00020` |
| REQ-002 | `presentResultArea` delegates to the unchanged `presentNetSalary`; domain and 001 tests untouched |
| REQ-003 | `input` listener in `src/main.ts` → `presentResultArea(value, 'live')`; `replaceChildren` clears old amounts |
| REQ-004 | `submit` listener (button + implicit Enter submission) → `presentResultArea(value, 'submit')`; DOM order input → button |
| REQ-005 | `EMPTY_STATE_HINT` + `kind: 'empty'` in live mode; initial render on load; `.hint` styling |
| REQ-006 | `breakdownLineRole` → `.line--gross/deduction/total/net`; `.line--net` slab and size/weight tokens; rules on `.line--total`/`.line--net` |
| REQ-007 | `isFieldInvalid` → `aria-invalid` + `aria-describedby`; `.error[role=alert]` with exact `textContent`; weight + bar cue |
| REQ-008 | `--motion-quick` 120ms, `--motion-reveal` 200ms; `shouldRevealResult` + `.reveal` keyframes; no count-up |
| REQ-009 | `:root` light tokens + `@media (prefers-color-scheme: dark)` token block; `color-scheme` meta; no toggle, no `matchMedia` |
| NFR-001 | No new network/storage APIs; no external URLs, `url()`, `@import` or `@font-face`; system font stack |
| NFR-002 | `:focus-visible` outlines, reduced-motion block, contrast pairs in §3.5, `lang="es-CR"`, label and `aria-live` kept |
| NFR-003 | `--size-target: 3rem`, fluid single-column grid, wrapping labels, `minmax(0, 1fr)` ledger (§3.4) |

## 5. Test strategy

**Step 0 — DOM test environment (explicit task required by Art. P1.3 and spec Q9, ADR-0002).** Before the tests
stage: add `jsdom`, `@testing-library/dom`, `@testing-library/user-event` and `postcss` to `devDependencies` in
`package.json` (with the lockfile updated by `npm install`) and create `tests/dom/`. `vite.config.ts` stays with
`environment: 'node'`; each DOM test file opts in with `// @vitest-environment jsdom` as its first line. No new
Vitest setup file. This must land first, so that the red check fails for missing behavior, not missing packages
(Art. B5.2). No other services are needed; no network.

**Isolation (Art. P1.4, B5.4):** no `vi.mock`. Legal parameters are injected (`fakeParams` as in
`net-salary-view.test.ts`). Browser APIs are only stubbed with `vi.stubGlobal` in privacy checks (existing pattern).
Files are read as text with `import.meta.glob(..., { query: '?raw', import: 'default', eager: true })`, reused from
`privacy.test.ts`.

**New test double / support:** `tests/support/css-audit.ts` (owned by the test-author; suggested helpers:
parse `src/style.css` with `postcss`, collect `:root` tokens per scheme, resolve `var(--x)`, `isAchromatic(value)`
per spec section 6, `relativeLuminance`, `contrastRatio`, `parseDurationMs`). No other doubles.

| Test file | Env | Covers |
|---|---|---|
| `tests/unit/result-area-view.test.ts` | node | AC-002.1, AC-002.2 (both modes; `''` only in submit), AC-003.5, AC-005.2, AC-005.3, AC-006.2; `breakdownLineRole`, `isFieldInvalid`, `shouldRevealResult` (marked `SDD: REQ-006`, `REQ-007`, `REQ-008`); AC-N001.1 (stubbed-globals check around `presentResultArea`, same pattern as `privacy.test.ts`) |
| `tests/unit/style-audit.test.ts` | node | AC-001.1 (stylesheet part), AC-001.2, AC-001.3, AC-006.1, AC-006.3, AC-008.1, AC-008.2, AC-009.1, AC-N001.2 (stylesheet part), AC-N001.3, AC-N002.1, AC-N002.2, AC-N002.3, AC-N003.1, AC-N003.2 (static proxy, see below) |
| `tests/unit/markup-audit.test.ts` | node | AC-001.1 (markup part: `index.html` + `src/main.ts` have no `style` attributes/`.style.`; theme-color values achromatic), AC-001.2 (`#b00020` absent from `src/**` and `index.html`), AC-009.2, AC-N001.2 (markup part), AC-N002.4 |
| `tests/unit/regression-001.test.ts` | node | AC-002.3: reads the 001 test files as text and asserts they still contain their 001 `SDD:` markers and no `.skip`/`.only`/`.todo`; the verifier additionally confirms with `git diff main -- tests/unit` that they are byte-identical |
| `tests/dom/salary-form.test.ts` | jsdom | AC-003.1–003.4, AC-004.1–004.3, AC-005.1, AC-007.1–007.3 |

**DOM tests (ADR-0002):** each test creates `<div id="app"></div>` in `document.body`, calls `vi.resetModules()` and
`await import('../../src/main')`; `userEvent.setup()` drives `type`, `clear`, `{Enter}`, `click` and `tab`. Queries
by role/label: `getByRole('textbox', { name: 'Salario bruto mensual (CRC)' })`, `getByRole('button', { name:
'Calcular' })`, `getByRole('alert')`; the result area via `#result`. Assertions on `aria-invalid`, alert
`textContent` (exact), absence of 500 000 amounts after editing (AC-003.2), `document.activeElement` after tabs.
`afterEach` empties `document.body`. The CSS import in `main.ts` resolves to an empty module in Vitest.

**Static audits (ADR-0003):** parse the stylesheet with `postcss`; resolve tokens per scheme; check every color
value outside token blocks is `var(--color-*)`, `currentColor` or `transparent`, and every token value is
achromatic; durations (+ delays) ≤ 300 ms after `var()` resolution; font-family values ⊆ the §3.5 allowlist; compare
`.line--net dd` font-size/weight against all other `.line*` rules at base and inside the `min-width` media query.

**AC-N003.2 (320 px) verification.** jsdom has no layout engine (ADR-0002), so the AC is covered twice:
1. *Automated static proxy* in `style-audit.test.ts` (marker `SDD: NFR-003 AC-N003.2`): `.breakdown` uses
   `minmax(0, 1fr) auto`; `dt` allows wrapping (`overflow-wrap: anywhere`, no `nowrap`); no `width`/`min-width`
   larger than 18rem and no `vw` widths above 100; `main` has inline padding; `--text-net` at base ≤ 2rem.
2. *Manual check* by the verifier, recorded in `verify-report.md`: `npm run build && npm run preview`, browser
   devtools at 320 × 640, input `5000000`, in both schemes: the label "CCSS — Seguro de Enfermedad y Maternidad
   (5,50 %)" and ₡275 000,00 are fully visible and `document.documentElement.scrollWidth <= 320`.

**Existing tests:** all files in `tests/unit/` from 001 remain unmodified and must pass (AC-002.3, AC-N001.1).

## 6. Risks and mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Implicit Enter submission or Tab order behaves differently in jsdom than in browsers, giving false reds/greens | Medium | Medium | Use `@testing-library/user-event` (implements implicit submission and tab sequencing); keep a real `<button type="submit">` in the form; manual smoke of Enter/Tab in the verifier's 320 px check |
| Static CSS audit is brittle (shorthands, `var()` chains, media contexts) and blocks legitimate styles | Medium | Medium | ADR-0003 convention: literals only in token blocks, plain `rem`/`ms` values, no `clamp()` for audited sizes; parse with `postcss`, not regex |
| AC-N003.2 cannot be fully automated (no layout in jsdom) | High | Low | Static proxy test + documented manual check in `verify-report.md` (§5), as allowed by spec Q9 |
| Live region announces on every keystroke (noisy for screen readers); `role="alert"` inside a polite region may double-announce | Medium | Low | Required by AC-N002.4/AC-007.1; reveal and DOM replacement only as needed; accepted for this feature, revisit in a future spec if users report it |
| A 001 test is touched or a `main.ts` rewrite drops `replaceChildren` (checked by `privacy.test.ts`) | Low | High | 001 tests are read-only; `regression-001.test.ts` + verifier `git diff`; rendering keeps `replaceChildren` in `src/main.ts` |
| `postcss` version drift versus the one Vite bundles | Low | Low | Pin a caret range compatible with Vite's; test-only dependency |
| Inline SVG or `xmlns` would introduce `http://` into markup (AC-N001.2) | Low | Low | No SVG or icons; the error cue is a CSS border |

## 7. Constitution compliance

- **B1 / B3:** full flow; this plan does not change the approved spec's scope.
- **B2:** planner wrote only this plan and ADRs; no code or tests.
- **B4:** every REQ/NFR mapped (§4); all 37 ACs assigned to a test file (§5), including AC-N003.2 (static proxy +
  manual check).
- **B5.2 / B5.6:** Step 0 installs test dependencies before the red check; skeletons for the four functions of
  `src/ui/result-area-view.ts` follow Art. P1.6 (`EMPTY_STATE_HINT` is a constant and keeps its value).
- **B5.3:** no 001 test modified, skipped or weakened (AC-002.3).
- **B5.4 / P1.4:** no network in tests; no `vi.mock`; dependencies injected (`params`) or stubbed globals.
- **P1.1 / P1.2 / P1.5:** tests under `tests/`, `*.test.ts`, explicit `vitest` imports, English names.
- **P1.3:** DOM environment added through the explicit Step 0 task; DOM tests confined to `tests/dom/` with the
  per-file docblock (ADR-0002); `tests/unit/` stays DOM-free.
- **P2.1:** `src/main.ts` only builds markup, reads the input, calls `presentResultArea` and pure helpers, and renders;
  no calculation. **P2.2:** calculation untouched in `src/domain/`. **P2.3:** amounts still via `formatCRC`.
  **P2.4:** no `any`, compiler options unchanged. **P2.5:** not affected (no legal parameters change).
- **P3.1:** no storage/network; no external resources (NFR-001). **P3.2:** validation reused from `parseGrossSalary`.
  **P3.3:** user values rendered only with `textContent`; the static template in `innerHTML` contains no user data.
- **P4:** Prettier covers the new `.ts`, `.css` and `.html`; `npm run format:check` must pass.
- **SHOULD not met:** none.

## 8. ADRs

- [ADR-0002](../../docs/decisions/ADR-0002-dom-test-environment.md) — Opt-in DOM test environment (jsdom + Testing
  Library) for page behavior. Proposed.
- [ADR-0003](../../docs/decisions/ADR-0003-stylesheet-tokens-and-static-audits.md) — Monochrome design tokens in one
  stylesheet, checked by static audits. Proposed.

Both were written earlier in this stage and are reused as-is; the index `docs/decisions/README.md` already lists them.
