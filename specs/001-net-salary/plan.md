# Plan 001 — Net monthly salary from gross salary (CCSS, LPT and income tax)

- **Spec:** [spec.md](spec.md) (approved on 2026-09-27)
- **Scopes:** `app`

## 1. Solution summary

The calculation is split into pure modules under `src/domain/`, following Art. P2.1–P2.2. The legal parameters for
2026 live in one module with their source and year (Art. P2.5). A string parser turns the raw input into cents, and
a calculator derives the contributions, income tax, total deductions and net salary. Money is handled as integer
cents typed as `bigint`, with rates in basis points and explicit round half up (ADR-0001), so REQ-005 holds exactly
for any finite input. A pure presenter in `src/ui/net-salary-view.ts` maps raw input to either a Spanish error
message or the ordered breakdown lines, formatted with the existing `formatCRC`. `src/main.ts` only reads the input,
calls the presenter and renders its output with `textContent`/`replaceChildren`.

## 2. Architecture impact

| Scope | Layer / area | New files | Modified files | Reason |
|---|---|---|---|---|
| app | Domain: money | `src/domain/money.ts` | — | `Cents` type, round-half-up division of `bigint`, conversion to `number` for display (REQ-005, ADR-0001) |
| app | Domain: legal parameters | `src/domain/legal-parameters.ts` | — | 2026 rates and brackets as named constants with source and year (NFR-002, Art. P2.5) |
| app | Domain: input | `src/domain/gross-salary.ts` | — | Validation and exact parsing of the gross salary into cents (REQ-001) |
| app | Domain: calculation | `src/domain/net-salary.ts` | — | SEM/IVM/LPT, income tax, totals and net (REQ-002..REQ-005) |
| app | UI: presenter (pure, no DOM) | `src/ui/net-salary-view.ts` | — | Spanish error messages, labels with rates, formatted amounts, legal year note (REQ-001, REQ-006) |
| app | UI: entry point | — | `src/main.ts` | Wire the form to the presenter; render with `textContent`; drop the placeholder text (REQ-001, REQ-006, NFR-001) |
| app | UI: styles | — | `src/style.css` | Styles for the result section, breakdown list and error message |
| app | Reused | — | `src/shared/format-crc.ts` (unchanged) | Only currency formatter (Art. P2.3) |
| app | Tests | `tests/unit/money.test.ts`, `tests/unit/gross-salary.test.ts`, `tests/unit/net-salary.test.ts`, `tests/unit/net-salary-view.test.ts`, `tests/unit/privacy.test.ts` | — | Coverage of every AC (section 5) |
| app | Decisions | `docs/decisions/ADR-0001-money-as-bigint-cents.md`, `docs/decisions/README.md` | — | Money representation decision |

## 3. Design

### 3.1 Data and migrations

Not applicable. There is no persistence, storage or backend (NFR-001, Art. P3.1). The only "data" is the in-code
legal parameter constant described in 3.2.

### 3.2 Contracts and interfaces

Exact signatures of the symbols the tests import. The `implementer` creates their skeletons following Art. P1.6:
the body throws `new Error("not implemented")` and parameters use the `_` prefix.

**`src/domain/money.ts`**

```ts
/** Money amount in integer cents (1 colón = 100n). */
export type Cents = bigint;

/** Divides a non-negative numerator by a positive divisor, rounding half up (away from zero). */
export function divideRoundHalfUp(numerator: bigint, divisor: bigint): bigint;

/** Converts cents to a colón amount as `number`, only for display (formatCRC). */
export function centsToNumber(cents: Cents): number;
```

**`src/domain/legal-parameters.ts`** (data module, see note after the block)

```ts
import type { Cents } from './money';

export interface ContributionRate {
  /** Rate in basis points: 1 bp = 0.01 %; 5.50 % = 550. */
  readonly basisPoints: number;
  readonly source: string;
}

export interface IncomeTaxBracket {
  /** Inclusive upper limit of the bracket in cents; `null` for the last, open-ended bracket. */
  readonly upperLimitCents: Cents | null;
  readonly rateBasisPoints: number;
}

export interface LegalParameters {
  readonly year: number;
  readonly sem: ContributionRate;
  readonly ivm: ContributionRate;
  readonly lpt: ContributionRate;
  readonly incomeTax: {
    readonly source: string;
    /** Ordered ascending; each bracket starts where the previous one ends (the first one starts at 0). */
    readonly brackets: readonly IncomeTaxBracket[];
  };
}

export const LEGAL_PARAMETERS_2026: LegalParameters;
/** The single legal year in force (spec Q1). Changing it updates every calculation and the displayed year. */
export const CURRENT_LEGAL_PARAMETERS: LegalParameters; // = LEGAL_PARAMETERS_2026
```

Values of `LEGAL_PARAMETERS_2026`, taken from spec section 6:

- `year: 2026`.
- `sem`: 550 bp, "CCSS, Reglamento del Seguro de Salud".
- `ivm`: 433 bp, "CCSS, Reglamento del Seguro de IVM (graduated increase, from 2026-01-01)".
- `lpt`: 100 bp, "Ley 7983 (LPT) / Ley Orgánica del Banco Popular".
- `incomeTax.source`: "Ministerio de Hacienda decree, 2026".
- `incomeTax.brackets`: `{91_800_000n, 0}`, `{134_700_000n, 1000}`, `{236_400_000n, 1500}`, `{472_700_000n, 2000}`,
  `{null, 2500}`.

Note: these constants are data, not logic, so they cannot throw. The `implementer` creates the module with its real
values during scaffolding. For this reason, AC-N002.1 tests **must** exercise the constants through
`calculateNetSalary`/`presentNetSalary` (which throw in the skeleton), so that the red check is legitimate. A test
that only reads the constants would pass from the start.

**`src/domain/gross-salary.ts`**

```ts
import type { Cents } from './money';

export type GrossSalaryError = 'empty' | 'not-a-number' | 'negative' | 'too-many-decimals';

export type ParseGrossSalaryResult =
  | { readonly ok: true; readonly grossCents: Cents }
  | { readonly ok: false; readonly error: GrossSalaryError };

export function parseGrossSalary(raw: string): ParseGrossSalaryResult;
```

**`src/domain/net-salary.ts`**

```ts
import type { Cents } from './money';
import type { IncomeTaxBracket, LegalParameters } from './legal-parameters';

export interface NetSalaryResult {
  readonly legalYear: number;
  readonly grossCents: Cents;
  readonly semCents: Cents;
  readonly ivmCents: Cents;
  readonly lptCents: Cents;
  readonly incomeTaxCents: Cents;
  readonly totalDeductionsCents: Cents;
  readonly netCents: Cents;
}

/** grossCents × basisPoints / 10 000, rounded half up to the cent. */
export function calculateContribution(grossCents: Cents, basisPoints: number): Cents;

/** Marginal progressive tax on grossCents; the total is rounded half up to the cent once. */
export function calculateIncomeTax(grossCents: Cents, brackets: readonly IncomeTaxBracket[]): Cents;

export function calculateNetSalary(grossCents: Cents, params: LegalParameters): NetSalaryResult;
```

**`src/ui/net-salary-view.ts`** (pure, no DOM access)

```ts
import type { GrossSalaryError } from '../domain/gross-salary';
import type { LegalParameters } from '../domain/legal-parameters';

export const GROSS_SALARY_ERROR_MESSAGES: Readonly<Record<GrossSalaryError, string>>;

export interface BreakdownLine {
  readonly label: string;
  /** Already formatted with formatCRC. */
  readonly amount: string;
}

export type NetSalaryView =
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'result'; readonly lines: readonly BreakdownLine[]; readonly legalYearNote: string };

export function presentNetSalary(rawInput: string, params?: LegalParameters): NetSalaryView;
// Implemented as `params: LegalParameters = CURRENT_LEGAL_PARAMETERS`; the skeleton uses `_params`.
```

`GROSS_SALARY_ERROR_MESSAGES` is a data constant with the four messages from spec section 6. The same note as for
the legal parameters applies: tests must check messages through `presentNetSalary`.

Errors: no function throws for user input. Invalid input is a value (`ok: false` / `kind: 'error'`), never silently
coerced (Art. P3.2). Authorization: not applicable.

### 3.3 Logic

**Money (`money.ts`, ADR-0001).**
- `divideRoundHalfUp(n, d)` = `(2n * n + d) / (2n * d)` with `bigint` truncating division. For `n >= 0` and `d > 0`,
  this is round half up. Every amount in this feature is non-negative.
- `centsToNumber(c)` = `Number(c) / 100`, used only at the display boundary.

**Gross salary parsing (`gross-salary.ts`).** The checks run in the order of the spec's error table, directly on
the string, never through a float:
1. `trimmed = raw.trim()`. If it is empty, the result is `empty` (AC-001.1). Surrounding whitespace is ignored
   (AC-001.7).
2. `trimmed` must match plain decimal notation, `/^[+-]?(\d+(\.\d*)?|\.\d+)$/`, and `Number(trimmed)` must be
   finite. Otherwise the result is `not-a-number`. This covers `abc`, `Infinity`, `NaN` and also exponent, hex or
   comma forms (`1e5`, `0x10`, `1.000,50`), as well as numeric strings too long to be finite (AC-001.2, AC-001.3).
3. If the string starts with `-` and its value is not zero, the result is `negative` (AC-001.4). `-0` is accepted
   as 0.
4. The fractional digits, after removing trailing zeros, must be at most 2. Otherwise the result is
   `too-many-decimals` (AC-001.5). For example, `1000.123` is rejected and `1000.10` is accepted.
5. `grossCents = BigInt(integerPart || '0') * 100n + BigInt(fraction.padEnd(2, '0'))`. This is exact at any
   magnitude.

**Calculation (`net-salary.ts`).**
- `calculateContribution(g, bp)` = `divideRoundHalfUp(g * BigInt(bp), 10_000n)` (REQ-002, REQ-005).
- `calculateIncomeTax(g, brackets)` works as follows (REQ-003):
  1. Start with `lower = 0n` and `acc = 0n`.
  2. For each bracket, take `upper = upperLimitCents ?? g`. If `g > lower`, add
     `(min(g, upper) − lower) × BigInt(rateBasisPoints)` to `acc`.
  3. Stop after an open-ended bracket. Otherwise set `lower = upper` and continue.
  4. Return `divideRoundHalfUp(acc, 10_000n)`.

  Tax is rounded once, on the total. With this rule, 918,000.01 gives 0.001, which rounds to 0.00 (AC-003.7).
  Upper limits are inclusive, so a salary exactly at a limit pays only the lower brackets (AC-003.2, AC-003.6). The
  tax base is the full gross salary, with no CCSS/LPT subtracted (spec section 6).
- `calculateNetSalary(g, params)` computes `sem`, `ivm` and `lpt` with `calculateContribution` and the income tax
  with `calculateIncomeTax`. Then `total = sem + ivm + lpt + tax` and `net = g − total`, so totals are derived from
  rounded amounts (REQ-004, REQ-005). `legalYear = params.year`. Because this uses `bigint`,
  `net + total === g` exactly (AC-004.7).
- Dependencies: the functions receive the `LegalParameters` as a parameter and do not import
  `CURRENT_LEGAL_PARAMETERS` themselves. This lets tests pass hand-written fake parameters (Art. P1.4, NFR-002).

**Presenter (`net-salary-view.ts`).**
- `presentNetSalary(raw, params = CURRENT_LEGAL_PARAMETERS)` first calls `parseGrossSalary`. On error, it returns
  `{ kind: 'error', message: GROSS_SALARY_ERROR_MESSAGES[error] }`.
- Otherwise it calls `calculateNetSalary(grossCents, params)` and returns the 7 lines in the spec order. Their
  labels are `Salario bruto`, then `CCSS — Seguro de Enfermedad y Maternidad (${rate(sem)})`,
  `CCSS — Invalidez, Vejez y Muerte (${rate(ivm)})`, `Banco Popular — LPT (${rate(lpt)})`,
  `Impuesto sobre la renta`, `Total de rebajas` and `Salario neto`. Each amount is
  `formatCRC(centsToNumber(x))`. The result also has
  `legalYearNote = \`Parámetros legales vigentes: ${params.year}\``.
- `rate(bp)` is a non-exported helper. It returns
  `new Intl.NumberFormat('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(bp / 100) + ' %'`,
  for example `5,50 %`. It uses a normal space and a literal `%` to match the spec's labels. It formats a percentage,
  not currency, so Art. P2.3 is respected.
- The labels use the em dash `—` (U+2014), exactly as in the spec.

**Reused utilities:** `formatCRC` (`src/shared/format-crc.ts`), unchanged.

### 3.4 User interface

Changes to the static template in `src/main.ts`, which stays static and contains no user values:
- **Input:** `<input id="gross-salary" name="gross-salary" type="text" inputmode="decimal" autocomplete="off" />`.
  `type="number"`, `required`, `min` and `step` are dropped. With `type="number"`, the browser turns `abc` into `""`
  and blocks empty or negative values with its own untranslated tooltip. Dropping these attributes ensures that the
  spec's Spanish messages (REQ-001) are the ones the user sees, and that `input.value` reaches the parser unaltered.
- **Result container:** `<output id="result">` is replaced by `<section id="result" aria-live="polite"></section>`.
  A `<dl>` is not valid inside `<output>`, and `aria-live` announces the updated result.
- **Submit handler:** it keeps `event.preventDefault()`, calls `presentNetSalary(input.value)` and then
  `renderView(result, view)`. `renderView` is a small local function in `main.ts` that contains no calculation
  logic. It builds the nodes with `document.createElement` and `textContent`, then calls
  `result.replaceChildren(...)`. The container is therefore always emptied before rendering, so an invalid submit
  after a valid one shows only the error (AC-001.6).
  - Error: `<p class="error" role="alert">message</p>`.
  - Result: `<dl class="breakdown">` with a `<dt>label</dt><dd>amount</dd>` pair per line, followed by
    `<p class="legal-year">legalYearNote</p>`.
- The placeholder text `(cálculo de rebajas pendiente)` and its comment are removed (AC-006.4).
- No `innerHTML` with user or computed values (Art. P3.3), no storage and no network (NFR-001).
- **`src/style.css`:** the `output` rule becomes `#result`. It adds minimal styles for `.breakdown` (two-column
  grid, right-aligned amounts), `.error` and `.legal-year`, and makes the `Salario neto` row bold (last `dt`/`dd`).

## 4. Map REQ → design

| REQ / NFR | Where it is resolved |
|---|---|
| REQ-001 | `parseGrossSalary` (`src/domain/gross-salary.ts`); messages in `GROSS_SALARY_ERROR_MESSAGES` and `presentNetSalary` (`src/ui/net-salary-view.ts`); `replaceChildren` render and text input in `src/main.ts` (AC-001.6) |
| REQ-002 | `calculateContribution` + `calculateNetSalary` (`src/domain/net-salary.ts`); rates in `LEGAL_PARAMETERS_2026` |
| REQ-003 | `calculateIncomeTax` (`src/domain/net-salary.ts`); brackets in `LEGAL_PARAMETERS_2026.incomeTax` |
| REQ-004 | `calculateNetSalary` (`totalDeductionsCents`, `netCents`) |
| REQ-005 | `divideRoundHalfUp` (`src/domain/money.ts`), integer-cent `bigint` model (ADR-0001), totals from rounded amounts in `calculateNetSalary` |
| REQ-006 | `presentNetSalary` (labels, order, rates, `formatCRC` amounts, legal year note); rendering in `src/main.ts` |
| NFR-001 | Pure modules with no I/O; `src/main.ts` without network or storage APIs; verified in `tests/unit/privacy.test.ts` |
| NFR-002 | Single module `src/domain/legal-parameters.ts` (`LEGAL_PARAMETERS_2026`, `CURRENT_LEGAL_PARAMETERS`), with parameters injected into `calculateNetSalary`/`presentNetSalary`; labels and year derived from them |

## 5. Test strategy

**Scope `app`: unit tests only (Vitest, `node` environment).** No integration tests or external services are needed,
and the environment only needs `npm install`. The tests follow Art. P1:
- they import `describe`/`it`/`expect` (and `vi` where noted) from `vitest`, and production code through relative
  paths `../../src/...`;
- they use English behavior names and a `// SDD: <IDs>` marker on the line before each `it`;
- they do not use DOM or `vi.mock`.

Files are placed flat in `tests/unit/`, matching the existing `tests/unit/format-crc.test.ts` and the example in
Art. P1.1. Amounts are asserted as `bigint` cents, for example `5_500_000n` for ₡55,000.00.

| Test file | Subject | ACs covered |
|---|---|---|
| `tests/unit/money.test.ts` | `divideRoundHalfUp`: exact half rounds up (`165_000n / 10_000n → 17n`), below half rounds down, exact division; `centsToNumber(88_350_000n) === 883500` | REQ-005 (supports AC-005.1) |
| `tests/unit/gross-salary.test.ts` | `parseGrossSalary`: `''` and `'   '` → `empty`; `'abc'`, `'Infinity'`, `'NaN'` → `not-a-number`; `'-1'` → `negative`; `'1000.123'` → `too-many-decimals`; `'  500000  '` → `ok`, `50_000_000n`; `'0'` → `0n`; `'333333.33'` → `33_333_333n` | AC-001.1, AC-001.2, AC-001.3, AC-001.4, AC-001.5, AC-001.7 |
| `tests/unit/net-salary.test.ts` | `calculateNetSalary(g, LEGAL_PARAMETERS_2026)` and `calculateIncomeTax` with each spec example: SEM/IVM/LPT for 1,000,000, 500,000, 333,333.33 and 0; tax for 500,000, 918,000, 1,000,000, 2,000,000, 5,000,000, 1,347,000, 2,364,000, 4,727,000 and 918,000.01; total/net for 500,000, 1,000,000, 2,000,000, 5,000,000, 918,000 and 0; 3.00 → 17n/13n/3n/33n/267n; 333,333.33 → total `3_609_999n`, net `29_723_334n` | AC-002.1–AC-002.4, AC-003.1–AC-003.7, AC-004.1–AC-004.6, AC-005.1, AC-005.2 |
| `tests/unit/net-salary.test.ts` (same file) | AC-004.7: loop over a fixed list of edge values (0, 1, 3, 918,000.01, the bracket limits ±1 cent, 10^15 colones) plus about 1,000 values from a deterministic hand-written generator (for example, a seeded LCG). For each value, assert `net + total === gross` and non-negative components. No property-testing library is added. | AC-004.7 |
| `tests/unit/net-salary.test.ts` (same file) | NFR-002, part 1: `calculateNetSalary(100_000_000n, CURRENT_LEGAL_PARAMETERS)` returns `legalYear === 2026` and the amounts from the 2026 table. Part 2: a hand-written **fake** `LegalParameters` (for example year 2099, SEM 1000 bp, a single bracket at 5000 bp) passed to `calculateNetSalary` changes the amounts and the year accordingly. Part 3: `LEGAL_PARAMETERS_2026` rates and brackets equal the section 6 values, in the same `it` as part 1 so that it fails red. | AC-N002.1 |
| `tests/unit/net-salary-view.test.ts` | `presentNetSalary`: each invalid input yields `kind: 'error'` with the exact Spanish message and no `lines`. For `'1000000'`: the exact 7 labels in order; each amount equals `formatCRC(n)` of the expected value (`Salario neto` contains `₡` and matches `/883\D500,00/`); `legalYearNote === 'Parámetros legales vigentes: 2026'`; no label or note contains `(cálculo de rebajas pendiente)`. A valid call followed by an invalid call returns an error view without lines (the presenter is stateless). A fake `LegalParameters` with year 2099 and different rates changes the labels' rates and the note. | AC-001.1–AC-001.6, AC-006.1–AC-006.4, AC-N002.1 |
| `tests/unit/privacy.test.ts` | Runtime part: install recording fakes with `vi.stubGlobal` for `fetch`, `XMLHttpRequest`, `WebSocket`, `navigator` (`sendBeacon`), `localStorage`, `sessionStorage`, `indexedDB` and `document` (`cookie` setter). Call `presentNetSalary('1000000')` and `calculateNetSalary(...)`, assert no fake was used, then `vi.unstubAllGlobals()`. Static part: load every `src/**/*.ts` as text with `import.meta.glob('../../src/**/*.ts', { query: '?raw', import: 'default', eager: true })` and assert none contains `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `localStorage`, `sessionStorage`, `indexedDB` or `document.cookie`. Assert that `src/main.ts` does not contain `(cálculo de rebajas pendiente)` and uses `replaceChildren` (backs AC-001.6 and AC-006.4 at the UI level without a DOM). | AC-N001.1, AC-006.4, AC-001.6 |

- **Test doubles:** they are hand-written and new, defined inline in the test files. They are the fake
  `LegalParameters` object and the recording global stubs. No shared fixture module is needed.
- **Red check:** every test calls at least one skeleton function (`parseGrossSalary`, `calculate*`,
  `presentNetSalary`, `divideRoundHalfUp`, `centsToNumber`) and fails with `not implemented`. The static part of
  `privacy.test.ts` fails because `src/main.ts` still contains the placeholder and no `replaceChildren`. The
  `test-author` must not write tests that only read the data constants.
- **Not tested automatically:** the actual DOM rendering in `src/main.ts`, because a DOM environment is not added
  (Art. P1.3). It is covered through the presenter and the static checks above, and checked manually in `npm run dev`.

## 6. Risks and mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Floating-point rounding errors (for example 0.165 → 0.16) or a cent drift between net and gross | High if `number` is used | High | `bigint` cents and basis points, parsing from the string, a single explicit `divideRoundHalfUp` (ADR-0001), and property-style tests for AC-004.7 |
| The spec's 2026 brackets or rates differ from the official decree | Medium | High | Confirmed by the user (Q1–Q2). They live in one module with source and year (NFR-002), so an update is a one-module change with tests. |
| `es-CR` users type a comma decimal (`1500000,50`) or thousand separators and get "número válido" | Medium | Low | Behavior follows the spec (only a plain decimal number is valid, with no silent coercion per Art. P3.2). Accepting commas would be a follow-up spec. |
| Switching `type="number"` to `type="text"` loses the numeric mobile keypad and native validation | Low | Low | `inputmode="decimal"` keeps the numeric keypad; validation is the domain's (REQ-001). |
| `import.meta.glob` with `?raw` in the static privacy test is not resolved by Vitest or not typed | Low | Medium | Vitest runs through Vite, and `vite/client` types (already in `tsconfig.json`) declare `import.meta.glob`. If it fails at red check, the test-author uses one explicit `?raw` import per file under `src/`. |
| The `Intl` output for the rate label differs from `5,50 %` (for example a different space) | Low | Medium | The `%` and the space are appended literally; `Intl` only formats the number. Tests assert the exact labels. |
| Display of amounts above about 9e13 colones loses cents in the `number` conversion | Very low | Low | The computed values stay exact; this is documented in ADR-0001. |

## 7. Constitution compliance

- **B1:** the change goes through the full flow with an approved spec.
- **B2:** this plan touches only `plan.md` and `docs/decisions/`.
- **B4:** every AC is mapped to a test file in section 5, and the `SDD:` markers are required.
- **B5:** tests are written before the implementation. The skeletons are listed in 3.2, and the red-check
  considerations for the data constants are in section 5. No external services are called (B5.4).
- **B5.7:** `noUnusedParameters` in `tsconfig.json` ignores `_`-prefixed parameters. Lint on skeletons is accepted
  per P1.6.
- **B6:** no secrets and no new environment variables.
- **P1.1–P1.5:** tests are under `tests/unit/*.test.ts`, in the `node` environment, with explicit imports from
  `vitest`, English names, no network, hand-written fakes passed as parameters, and no `vi.mock` (`vi.stubGlobal`
  stubs globals, not modules). The files are placed flat, as in the P1.1 example and the existing test.
- **P1.6:** the skeleton shape is as described in 3.2.
- **P2.1:** `src/main.ts` only reads input, calls `presentNetSalary` and renders.
- **P2.2:** calculation is in pure modules under `src/domain/`.
- **P2.3:** `formatCRC` is the only currency formatter; the rate formatter formats a percentage.
- **P2.4:** strict mode, no `any`, compiler options unchanged.
- **P2.5:** named constants with source and year are kept in one module.
- **P2 General:** Spanish UI text, English identifiers and tests, Prettier formatting.
- **P3.1:** no network or storage, verified by `privacy.test.ts`.
- **P3.2:** validation happens before calculating, and there is no coercion (more than 2 decimals is rejected, not
  rounded).
- **P3.3:** rendering uses only `textContent`/`createElement`. The remaining `innerHTML` in `main.ts` is the static
  template, with no user values.
- **P4:** `npm run format:check` must pass at verify.
- **Presenter location:** P2.2 recommends `src/domain/` for calculation logic. The presenter
  (`src/ui/net-salary-view.ts`) is not calculation logic but pure presentation mapping (Spanish labels, formatting),
  so it goes in a new `src/ui/` folder. It stays DOM-free so that it can be tested in `node`. No "SHOULD" rule is
  broken.

## 8. ADRs

- [ADR-0001 — Represent money as integer cents (`bigint`) in the domain](../../docs/decisions/ADR-0001-money-as-bigint-cents.md) (Proposed)
