# Review 002 — Minimalist, dynamic, monochrome calculator UI

- **Iteration:** 1 of 3
- **Diff reviewed:** `git diff main...feat/002-ui-redesign` @ `1f7892e` (+ uncommitted `specs/002-ui-redesign/state.json`; untracked `.claude/skills/` is not part of the feature)
- **Veredicto:** CHANGES_REQUESTED

## 1. Summary

The change adds a pure `src/ui/result-area-view.ts` (live/submit modes, empty state, line roles, invalid state,
reveal decision), rewires `src/main.ts` for live recalculation, and rewrites `src/style.css` around achromatic tokens
with light/dark schemes, reduced motion and focus styles. Logic, privacy, accessibility semantics and test integrity
are solid, and every spec AC is met. Two unjustified deviations from the approved design plan remain: the desktop
two-column layout is broken (the three children of `main` are auto-placed into two columns), and the inverted
"Salario neto" slab, the plan's one memorable element, was not implemented.

## 2. Spec compliance

| REQ / AC | Implemented as specified? | Evidence (file:line or test) |
|---|---|---|
| AC-001.1 | Yes | Color literals only in token blocks `src/style.css:10-14`, `:51-55`; theme-color metas `index.html:6-8`; no `style` in `src/main.ts`. Tests `style-audit.test.ts:32,50`, `markup-audit.test.ts` |
| AC-001.2 | Yes | `.error` uses `var(--color-ink)` `src/style.css:175-181`; `#b00020` absent from `src/` and `index.html` |
| AC-001.3 | Yes | No named chromatic colors in `src/style.css`; `style-audit.test.ts:71` |
| AC-002.1 | Yes | `presentResultArea` delegates to unchanged `presentNetSalary` `src/ui/result-area-view.ts:26`; `result-area-view.test.ts:14` |
| AC-002.2 | Yes | Same path; `result-area-view.test.ts:34` |
| AC-002.3 | Yes | `git diff main...HEAD` shows no change to the six 001 test files, `src/domain/`, `src/shared/`, `src/ui/net-salary-view.ts`; `regression-001.test.ts` (see F6) |
| AC-003.1 | Yes | `input` listener `src/main.ts:109`; `salary-form.test.ts:30` |
| AC-003.2 | Yes | `result.replaceChildren(content)` `src/main.ts:96`; `salary-form.test.ts:42` |
| AC-003.3 | Yes | `src/ui/result-area-view.ts:23-26`; `salary-form.test.ts:59` |
| AC-003.4 | Yes | Live + `trim() === ''` → empty `src/ui/result-area-view.ts:23-25`; `salary-form.test.ts:79` |
| AC-003.5 | Yes | Single code path `src/ui/result-area-view.ts:18-27`; `result-area-view.test.ts` AC-003.5 test |
| AC-004.1 | Yes | `submit` → `'submit'` mode `src/main.ts:111-114`; `salary-form.test.ts:98` |
| AC-004.2 | Yes | Implicit submission via `<button type="submit">` `src/main.ts:71`; `salary-form.test.ts:110` |
| AC-004.3 | Yes | DOM order input → button, no `tabindex` `src/main.ts:70-71`; `salary-form.test.ts:121` |
| AC-005.1 | Yes | Initial `evaluate('live')` `src/main.ts:107`; `salary-form.test.ts:137` |
| AC-005.2 | Yes | `src/ui/result-area-view.ts:23-25`, hint constant matches spec §6 `:7`; test is loose (F7) |
| AC-005.3 | Yes | Submit keeps 001 empty error `src/ui/result-area-view.ts:26`; `result-area-view.test.ts:72` |
| AC-006.1 | Yes | `.line--net dd` 2rem/750 vs max 1.125rem/600 `src/style.css:218-236`, 3rem at ≥48rem `:283-285`; `style-audit.test.ts:81,101` |
| AC-006.2 | Yes | Presenter unchanged; `result-area-view.test.ts` AC-006.2 test |
| AC-006.3 | Yes | `border-top` + `margin-top` on `.line--total, .line--net` `src/style.css:238-243`; `style-audit.test.ts:121` |
| AC-007.1 | Yes | `aria-invalid`/`aria-describedby` `src/main.ts:98-101`, `role="alert"` `:33`; `salary-form.test.ts:148` |
| AC-007.2 | Yes | Attributes removed `src/main.ts:102-103`; `salary-form.test.ts:160` |
| AC-007.3 | Yes | `textContent = view.message`, no generated content in `.error` `src/main.ts:34`; `salary-form.test.ts:175` |
| AC-008.1 | Yes | 120ms / 200ms tokens, no delays `src/style.css:44-45`; `style-audit.test.ts:140` |
| AC-008.2 | Yes | `.reveal` animation `src/style.css:251-253`; field/button transitions `:119-122`, `:147-150` |
| AC-009.1 | Yes | `:root` + `@media (prefers-color-scheme: dark)` `src/style.css:6-57`; `style-audit.test.ts:207` |
| AC-009.2 | Yes | No toggle, no `matchMedia`, no storage in `src/` |
| AC-N001.1 | Yes | No network/storage API referenced under `src/` (grep); `privacy.test.ts` unchanged and passing |
| AC-N001.2 | Yes | No external URLs, `url()` or `@import` in `index.html` / `src/style.css` |
| AC-N001.3 | Yes | System stack only, no `@font-face` `src/style.css:17` |
| AC-N002.1 | Yes | `:focus-visible` 2px ink outline `src/style.css:159-163`; no `outline: none` |
| AC-N002.2 | Yes | Reduced-motion block `src/style.css:288-295` |
| AC-N002.3 | Yes | Tokens per plan §3.5 (ink/paper 21:1, graphite ≥7:1, rule ≥4.5:1); `style-audit.test.ts:305` |
| AC-N002.4 | Yes | `lang="es-CR"`, label, `aria-live="polite"` `src/main.ts:69,73` |
| AC-N003.1 | Yes | `min-height: var(--size-target)` = 3rem `src/style.css:41,107,136` |
| AC-N003.2 | Pending (manual) | Static proxy passes (`style-audit.test.ts:353`), but the proxy's `.breakdown` check is satisfied by a no-op declaration (F5). The 320 px manual check documented in `verify-report.md` §3 has **not yet been confirmed by the user**; this is a pending confirmation, not a code defect. |

## 3. Plan compliance

- **Result-area module, entry point, DOM contract (§3.2, §3.3):** followed exactly. `presentResultArea`,
  `breakdownLineRole` (with `RangeError`), `isFieldInvalid`, `shouldRevealResult` match the planned logic; `main.ts`
  keeps `previousKind`, `data-state`, role classes, `reveal`, `replaceChildren`.
- **Desktop layout (§3.4 "Responsive", §3.5 layout sketch):** not met. The plan puts heading + form in the left column
  and the ledger in the right one; the implementation only sets `grid-template-columns` on `main`, so auto-placement
  yields a different layout (F1). No justification recorded.
- **Net salary slab (§3.5 type table, principle 2, contrast pair "paper/ink (net slab text)"):** not implemented; the
  net line is only larger/heavier text with a 1px rule (F2). No justification recorded.
- **`.breakdown` grid (§3.4):** the plan put the `minmax(0, 1fr) auto` grid on `.breakdown`; the implementation moved it
  to each `.line` (reasonable, since each line is a `div` wrapper) but left an inert copy on `.breakdown` (F5).
- **Smaller visual deviations:** field value weight 500 (§3.5 table) not set; the rule before "Salario neto" is not
  heavier than the one before "Total de rebajas" (§3.5 layout concept) (F8).
- **`toDisplayText` (NBSP → space in `src/main.ts:14-16`):** not in the plan; forced by the DOM test literals and
  approved by the user at the implement gate (history 2026-09-28T07:03:38). Trade-off assessed in F3/F4.
- **Test deviations:**
  - T-034: the "001 files keep their `SDD:` markers" sub-check was dropped. Acceptable: `format-crc.test.ts` has no
    marker, and byte-identity of the 001 files is confirmed by `git diff main...HEAD` (empty for all six). The task text
    in `tasks.md:52` now over-describes the test, and the other five files could still be checked (F6, NIT).
  - `tests/support/node-fs.d.ts`: an ambient declaration of `readFileSync` instead of adding `@types/node`, needed
    because Vitest turns `.css` imports (even `?raw`) into empty modules. Acceptable and scoped to tests; it merges
    harmlessly if `@types/node` is ever added, and should then be deleted. No finding.

## 4. Constitution checklist

### Part I (base)
- [x] B2: each agent stayed in role; `snapshot --check` is identical (7 files) and `git diff b238b0e HEAD -- tests` is empty.
- [x] B4: `SDD:` markers match the ACs they test; all 37 ACs have a marker.
- [x] B5: no test deleted, skipped or weakened; no external services; skeletons replaced (no `not implemented` left in `src/`). `npm test`: 103/103 passing (re-run by the reviewer).
- [x] B5.7: lint and typecheck clean per `verify-report.md`.
- [x] B6.5: no secrets; no new environment variables.

### Part II (project)
- [x] P1.1–P1.2, P1.5: tests under `tests/`, `*.test.ts`, explicit `vitest` imports, English names.
- [x] P1.3: jsdom added by explicit task T-001 (ADR-0002); DOM tests only in `tests/dom/` with the per-file docblock.
- [x] P1.4: no `vi.mock`, no network; params injected.
- [x] P2.1: `src/main.ts` only builds markup, reads input, calls `presentResultArea` and pure helpers, and renders. `toDisplayText` is a display-only string normalization, not calculation logic.
- [x] P2.2: domain untouched; new view logic is pure and DOM-free.
- [~] P2.3: amounts still come from `formatCRC`, but `toDisplayText` post-processes its output in the UI, a second place that decides how amounts are written (F3/F4).
- [x] P2.4: no `any`, compiler options unchanged.
- [x] P2.5: not affected.
- [x] P2 General 1: only new user-facing text is the spec'd hint, in Spanish.
- [x] P3.1: no network, storage or third-party resources (grep of `src/` and `index.html`).
- [x] P3.2: validation reused through `presentNetSalary` / `parseGrossSalary`.
- [x] P3.3: user-derived values rendered with `textContent`; `innerHTML` only for the static template `src/main.ts:65-75`.
- [x] P4: `format:check` passes per `verify-report.md`.
- [x] Achromatic palette, motion ≤300 ms and reduced motion, visible focus: verified in `src/style.css` (see §2).

## 5. Findings

| # | Severity | File:line | Finding | Owner |
|---|---|---|---|---|
| F1 | MAYOR | `src/style.css:267-273` | At `min-width: 48rem`, `main` becomes a 2-column grid, but it has **three** children (`h1`, `form`, `section#result`, `src/main.ts:66-74`) and no rule places them. Auto-placement puts `h1` in row 1 col 1, the **form in row 1 col 2** and the **result area in row 2 col 1**, the narrow `minmax(14rem, 18rem)` column. Result: the form sits beside the heading on the right and the ledger is squeezed under the heading on the left. At 3rem, the net amount (`₡883 500,00`, nowrap `dd` `:209`) plus the gap barely fits or overflows 18rem. This contradicts plan §3.4 ("form left, result right") and the §3.5 desktop sketch (heading + form left, ledger right). Fix: place the items explicitly, e.g. `h1`/`form` in column 1 and `#result` in column 2 spanning the rows, or wrap heading + form in one grid item. jsdom cannot catch this; check it manually at ≥768 px. | implementer |
| F2 | MAYOR | `src/style.css:233-243` | The inverted "Salario neto" slab from plan §3.5 (ink fill, paper text; "Spend boldness once"; type table "on the inverted slab"; contrast pair "paper/ink (net slab text)"; sketches with label and amount on the slab) is missing. `.line--net` only gets a 1px rule and a larger `dd`. Side effect at 320 px: with a 2rem nowrap amount in the same row, `Salario neto` (`dt`, `overflow-wrap: anywhere` `:199`) gets ~40 px and breaks mid-word. This is an unjustified deviation from the approved design. Either implement the slab (e.g. `.line--net { background-color: var(--color-ink); color: var(--color-paper); … }`, optionally stacking label over amount), or have the planner record the deviation in `plan.md` with user approval. | implementer |
| F3 | MENOR | `tests/dom/salary-form.test.ts:38,48,53-55,117` | The DOM assertions hardcode amounts with U+0020 group separators, while `formatCRC` (`Intl` es-CR) emits U+00A0. This forced the production workaround `toDisplayText` (`src/main.ts:14-16`). Trade-off: it is display-only, has no effect on calculation, keeps the pure functions untouched, and `dd { white-space: nowrap }` (`src/style.css:209`) preserves the no-break behavior on screen, so it is acceptable for now (user-approved). But it rewrites `formatCRC` output in the UI (P2.3 spirit), changes the rendered text versus 001 (copy/paste and screen readers now get plain spaces), and exists only to satisfy the test encoding. Follow-up: make the DOM assertions separator-agnostic (build the expected strings with `formatCRC(...)`, as `result-area-view.test.ts:18-24` already does, or normalize `\s`/U+00A0 in the assertion), via an authorized `rework tests` + new snapshot, and then remove `toDisplayText` (F4). Deferrable with user approval. | test-author |
| F4 | NIT | `src/main.ts:15` | `amount.replaceAll(' ', ' ')`: the first argument is a literal, invisible U+00A0 (bytes `C2 A0`), so the line reads as a no-op and can be lost to an editor or formatter normalizing whitespace. While the workaround stays, write it as `' '`. Remove the helper once F3 is done. | implementer |
| F5 | MENOR | `src/style.css:183-187` | `.breakdown { display: block; grid-template-columns: minmax(0, 1fr) auto; }`: `grid-template-columns` has no effect on a block container (the real grid is on `.line`, `:189-195`). It only satisfies the static proxy for AC-N003.2 (`tests/unit/style-audit.test.ts:356-363`, which checks that the declaration exists, not that `.breakdown` is a grid). Either make the declaration effective (e.g. `.breakdown { display: grid; … }` with `.line { grid-column: 1 / -1; grid-template-columns: subgrid; }`, which also aligns the amounts column across lines), or, if the per-line grid stays, the test-author should retarget the proxy to the rule that actually lays out the lines and require `display: grid`, after which the dead declaration is removed. | implementer |
| F6 | NIT | `tests/unit/regression-001.test.ts:15-39`; `specs/002-ui-redesign/tasks.md:52` | The AC-002.3 test checks the file count and the absence of `.skip/.only/.todo/xit/xdescribe`, but no longer checks markers, so it would not catch a 001 test being edited or weakened (that guarantee comes only from the verifier's `git diff`). The deviation is justified for `format-crc.test.ts` (no markers), but the five files that do carry `SDD:` markers could still be checked (e.g. minimum marker count per file), and T-034's wording no longer matches the test. | test-author |
| F7 | NIT | `tests/unit/result-area-view.test.ts:67-68` | The AC-005.2 test accepts any hint (`hint: expect.any(String)`) instead of the exact spec text. The DOM test compares against the `EMPTY_STATE_HINT` constant itself, so no test pins the literal "Ingrese su salario bruto mensual para ver el desglose." from spec §6. It is correct today (`src/ui/result-area-view.ts:7`). | test-author |
| F8 | NIT | `src/style.css:104-118`, `:238-243` | Small visual deviations from plan §3.5: the field value lacks `font-weight: 500` (it inherits 400), and the rule above "Salario neto" is the same 1px as the one above "Total de rebajas", while the layout concept calls for "a heavier rule, then the result". Consider handling them with F2. | implementer |

**Pending, not a defect:** the manual AC-N003.2 check (320 × 640, input `5000000`, both schemes) still needs the
user's confirmation. After F1/F2, also check the desktop layout at ≥ 768 px in the same session.

## 6. Decision

CHANGES_REQUESTED: two MAYOR findings are open (F1 desktop grid placement, F2 missing net-salary slab), both
unjustified deviations from the approved design plan and both owned by the implementer. They are CSS-only fixes and
need no test changes. F3 and F5 are MENOR and can be deferred to a follow-up with user approval. F4, F6, F7 and F8 are
optional. Logic, privacy (P3.1), P2.1, achromatic palette, motion and reduced motion, accessibility semantics and test
integrity all pass.

## Comentarios del usuario
