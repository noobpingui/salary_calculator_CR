# Review 001 — Net monthly salary from gross salary (CCSS, LPT and income tax)

- **Iteration:** 1 of 3
- **Diff reviewed:** `git diff main...feat/001-net-salary` @ `13486b7` (the only uncommitted change is `specs/001-net-salary/state.json`, owned by the orchestrator)
- **Veredicto:** APPROVED

## 1. Summary

The feature turns the walking skeleton into a working calculator. Pure domain modules (`src/domain/`) parse the
gross salary from the string into `bigint` cents, apply the 2026 SEM/IVM/LPT rates and the marginal income tax
brackets with explicit round half up, and derive totals and net from the rounded amounts. A pure presenter
(`src/ui/net-salary-view.ts`) maps the result to Spanish labels formatted with `formatCRC`, and `src/main.ts` only
renders it with `textContent`/`replaceChildren`. The implementation follows the plan closely and is correct for
every AC. The tests are untouched since the tests stage. The findings are one MINOR test weakness and a few NITs.

Commands re-run by the reviewer at `13486b7`: `npm test` (56/56 pass), `npm run lint`, `npm run typecheck` and
`npm run format:check` (Art. P4) all clean.

## 2. Spec compliance

| REQ / AC | Implemented as specified? | Evidence (file:line or test) |
|---|---|---|
| AC-001.1 | Yes | `src/domain/gross-salary.ts:13-16`; message `src/ui/net-salary-view.ts:11`; tests `gross-salary.test.ts:6,11`, `net-salary-view.test.ts:8` |
| AC-001.2 | Yes | `gross-salary.ts:10,18-20` (plain decimal regex); message `net-salary-view.ts:12`; `gross-salary.test.ts:16` |
| AC-001.3 | Yes | `gross-salary.ts:18` (regex rejects `Infinity`/`NaN`, plus `Number.isFinite`); `gross-salary.test.ts:21,26` |
| AC-001.4 | Yes | `gross-salary.ts:22-24`; message `net-salary-view.ts:13`; `-0` accepted (`gross-salary.test.ts:36`) |
| AC-001.5 | Yes | `gross-salary.ts:27-33` (trailing zeros stripped as the plan says, then > 2 digits rejected, never rounded; Art. P3.2); message `net-salary-view.ts:14` |
| AC-001.6 | Yes | `src/main.ts:14,32` always `replaceChildren` the container; presenter is stateless (`net-salary-view.test.ts:52`); static check `privacy.test.ts:99`. The actual DOM swap is not automated (no DOM, Art. P1.3); confirmed by reading `main.ts` |
| AC-001.7 | Yes | `gross-salary.ts:13` (`trim`); `gross-salary.test.ts:53` |
| AC-002.1–AC-002.4 | Yes | `src/domain/net-salary.ts:17-19,43-45`; `net-salary.test.ts:38-67` |
| AC-003.1–AC-003.7 | Yes | `net-salary.ts:22-40` (inclusive upper limits, marginal, single rounding on the total); `net-salary.test.ts:72-106` |
| AC-004.1–AC-004.6 | Yes | `net-salary.ts:47-48`; `net-salary.test.ts:111-150` (hand-checked AC-004.5: 50,490.00 + 39,749.40 + 9,180.00 + 0 = 99,419.40) |
| AC-004.7 | Yes | `bigint` arithmetic `net-salary.ts:47-48`; edge values + 1,000 seeded LCG values `net-salary.test.ts:155` |
| AC-005.1 | Yes | `src/domain/money.ts:5-7` (`(2n·n + d) / 2d`); `net-salary.test.ts:182`, `money.test.ts:6` |
| AC-005.2 | Yes | totals from rounded amounts `net-salary.ts:47`; `net-salary.test.ts:192` |
| AC-006.1 | Yes | `src/ui/net-salary-view.ts:52-69` (7 labels in spec order, em dash, rates from params); `net-salary-view.test.ts:67` asserts the literal labels |
| AC-006.2 | Yes | `net-salary-view.ts:68` uses `formatCRC` (Art. P2.3); `net-salary-view.test.ts:83` |
| AC-006.3 | Yes | `net-salary-view.ts:74`; `net-salary-view.test.ts:94` |
| AC-006.4 | Yes | placeholder removed from `main.ts` (diff); `net-salary-view.test.ts:102`, `privacy.test.ts:92` |
| AC-N001.1 | Yes | no network/storage API in `src/**`; runtime stubs `privacy.test.ts:12`, static scan `privacy.test.ts:72` |
| AC-N002.1 | Yes | `src/domain/legal-parameters.ts:28-55` (values match spec §6 and plan §3.2, with source and year); parameters injected into `calculateNetSalary`/`presentNetSalary` (`net-salary-view.ts:43`); `net-salary.test.ts:201,220`, `net-salary-view.test.ts:116` |

## 3. Plan compliance

- Files, signatures and algorithms match plan §3.2–§3.4 exactly (`money.ts`, `legal-parameters.ts`,
  `gross-salary.ts`, `net-salary.ts`, `net-salary-view.ts`, `main.ts` template and `renderView`, `style.css`).
  `src/shared/format-crc.ts` is unchanged, and no new currency formatter is added (the rate formatter formats a
  percentage, as the plan justifies).
- **Reported deviation:** `const [integerPartRaw = '', fractionRaw = ''] = unsigned.split('.')`
  (`src/domain/gross-salary.ts:27`) instead of the plan's `BigInt(integerPart || '0')` skeleton. **Assessment:
  justified and behavior-neutral.** Under `noUncheckedIndexedAccess` (Art. P2.4, which forbids relaxing it), the
  destructured elements are `string | undefined`. The defaults remove that without a non-null assertion or a cast.
  `fractionRaw` really can be missing (input without `.`), and `integerPartRaw` is `''` for `.5`. Line 28 then maps
  `''` to `'0'`, which is exactly the plan's `integerPart || '0'`. Because the regex at line 10 allows at most one
  `.`, `split` never returns a third part that could be silently dropped. Inputs `1.`, `.5`, `+5`, `-0` and
  `1000.10` all give the values the plan expects.
- Minor wording difference: plan §3.3 step 3 defines the negative check as "starts with `-` and its value is not
  zero". The code uses `Number(trimmed) < 0` (`gross-salary.ts:22`). The two differ only for extreme float
  underflow (see F3).

## 4. Constitution checklist

### Part I (base)
- [x] B2: roles respected. `snapshot --check` is **identical** (0 changed/missing/added), and
      `git diff 4ac2b39 HEAD -- tests` is empty. The tests did not change during implement.
- [x] B4: every AC has at least one `// SDD:` marker on the line before its `it`, and the markers match what the tests
      check, except for two loose AC-001.7 markers (F2).
- [x] B5: no test was deleted, skipped (`.skip`/`.only`/`xit`) or weakened. There are no external calls: globals are
      stubbed with hand-written fakes. No skeleton `not implemented` bodies remain in `src/`.
- [x] B5.7: `npm run lint` and `npm run typecheck` are clean, re-run by the reviewer.
- [x] B6.5: no secrets and no new environment variables.

### Part II (project)
- [x] P1.1–P1.2: tests are in `tests/unit/*.test.ts`, flat as in the existing test. They import `describe`/`it`/`expect`
      explicitly from `vitest` and reach production code through relative paths.
- [x] P1.3: `node` environment. The `document` global is only a stub in `privacy.test.ts:39`, and no DOM environment
      is added.
- [x] P1.4: no network. `vi.stubGlobal` stubs globals (plan §5 justifies it), and `vi.mock` is not used.
- [x] P1.5: new test names are in English and describe behavior. The pre-existing `format-crc.test.ts` has a Spanish
      name, but it is outside this diff.
- [x] P1.6: skeletons were replaced by implementations.
- [x] P2.1: `src/main.ts` only reads input, calls `presentNetSalary` and renders (`main.ts:52-57`). It has no
      calculation logic.
- [x] P2.2: calculation is in pure modules under `src/domain/`. The presenter in `src/ui/` is DOM-free, as justified
      in plan §7.
- [x] P2.3: `formatCRC` is the only currency formatter (`net-salary-view.ts:53-68`).
- [x] P2.4: no `any`, and `tsconfig` is unchanged. The deviation above keeps `noUncheckedIndexedAccess` intact.
- [x] P2.5: rates and brackets are named constants in one module, with source and year
      (`legal-parameters.ts:28-55`).
- [x] P2 General.1: UI text is Spanish; identifiers, comments and tests are English.
- [x] P2 General.2 / P4: `npm run format:check` passes, re-run by the reviewer. `verify-report.md` does not list it,
      but it was confirmed here.
- [x] P3.1: salary data is not sent or persisted.
- [x] P3.2: input is validated before calculating. More than 2 decimals is rejected, not rounded, and every invalid
      form is reported with a Spanish message.
- [x] P3.3: user and computed values reach the DOM only through `textContent` (`main.ts:13,22,24,30`). The only
      `innerHTML` is the static template, with no interpolated values (`main.ts:36`).

## 5. Findings

| # | Severity | File:line | Finding | Owner |
|---|---|---|---|---|
| F1 | MENOR | `tests/unit/net-salary-view.test.ts:9-48, 58-61` | The error-view tests for AC-001.1–AC-001.5 compare `message` with `GROSS_SALARY_ERROR_MESSAGES.<key>`, the same constant the production code returns. This assertion is tautological for the literal Spanish text, which is the core of those ACs (spec §6 error table). A typo in `src/ui/net-salary-view.ts:11-14` would pass all tests. Task T-023 asks for "the exact Spanish message". The current constant values match spec §6 exactly (checked by the reviewer), so there is no defect today, only a regression gap. Suggested fix: assert the four literal strings from spec §6. That is a `rework tests` with a new snapshot, so it can be deferred with user approval. | test-author |
| F2 | NIT | `tests/unit/gross-salary.test.ts:57,62` | `parses zero into zero cents` and `parses a value with cents into exact cents` carry the marker `SDD: REQ-001 AC-001.7`, but AC-001.7 is about surrounding whitespace. These tests support REQ-001 in general, so `// SDD: REQ-001` would be the accurate marker (task T-016 grouped them the same way). | test-author |
| F3 | NIT | `src/domain/gross-salary.ts:22` | The sign check uses `Number(trimmed) < 0`. For a negative value with hundreds of leading fractional zeros (e.g. `-0.` followed by 400 zeros and `1`), `Number` underflows to `-0`, so the input gets `too-many-decimals` instead of `negative`. It is still rejected, never coerced, so the impact is negligible. A string-based check (leading `-` and a non-zero digit present), as in plan §3.3 step 3, would match the plan literally. | implementer |
| F4 | NIT | `docs/decisions/ADR-0001-money-as-bigint-cents.md:3`, `docs/decisions/README.md:5` | ADR-0001 is still `Proposed`, although the plan that adopts it was approved and implemented. Also, the ADR describes rounding as `(n + 5000n) / 10000n`, while the code uses the general `(2n·n + d) / (2n·d)` (`money.ts:6`). Both are equivalent for `d = 10 000`. The status could be updated to `Accepted` (and the README index with it) at the docs stage. | planner |
| F5 | NIT | `src/main.ts:12`, `src/main.ts:44` | The error `<p role="alert">` is inserted inside a `<section aria-live="polite">`. Some screen readers announce the message twice. One of the two mechanisms is enough. The plan (§3.4) prescribes both, so this is a design note. | planner |

Count: 0 BLOQUEANTE · 0 MAYOR · 1 MENOR · 4 NIT.

## 6. Decision

**APPROVED.** No BLOCKING or MAJOR findings are open. Every AC is implemented as specified, and the test snapshot
is intact. All configured commands pass, plus `format:check`. F1 is a test-strength gap. It can be deferred to a
follow-up task with the user's approval, or fixed now through `rework tests` if the user prefers. F2–F5 are
optional.

## Comentarios del usuario
