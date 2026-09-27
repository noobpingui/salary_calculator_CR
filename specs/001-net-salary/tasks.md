# Tasks 001 — Net monthly salary from gross salary (CCSS, LPT and income tax)

- **Plan:** [plan.md](plan.md) (approved on 2026-09-27)

## Phase A0 — Scaffolding (implementer, scaffold mode)
<!-- New symbols the tests will import. Functions throw exactly "not implemented" (Art. B5.6, P1.6).
     The two data constants (`LEGAL_PARAMETERS_2026`/`CURRENT_LEGAL_PARAMETERS` and
     `GROSS_SALARY_ERROR_MESSAGES`) hold no logic and cannot throw, so they are created here with their real,
     final values (plan §3.2 note) — marked `(config)` instead of `(scaffold)`. -->
- [x] T-001 [REQ-005] (scaffold) Create `Cents` type and the `divideRoundHalfUp`/`centsToNumber` skeletons, each throwing `new Error("not implemented")` — `src/domain/money.ts`
- [x] T-002 [NFR-002] (config) Create `LEGAL_PARAMETERS_2026` and `CURRENT_LEGAL_PARAMETERS` with the real 2026 rates and income tax brackets from spec §6 (data only, no throwing) — `src/domain/legal-parameters.ts`
- [x] T-003 [REQ-001] (scaffold) Create the `GrossSalaryError`/`ParseGrossSalaryResult` types and the `parseGrossSalary` skeleton, throwing "not implemented" — `src/domain/gross-salary.ts`
- [x] T-004 [REQ-002, REQ-003, REQ-004] (scaffold) Create the `NetSalaryResult` type and the `calculateContribution`/`calculateIncomeTax`/`calculateNetSalary` skeletons, each throwing "not implemented" — `src/domain/net-salary.ts`
- [x] T-005 [REQ-001] (config) Create `GROSS_SALARY_ERROR_MESSAGES` with the four Spanish error messages from spec §6 (data only, no throwing) — `src/ui/net-salary-view.ts`
- [x] T-006 [REQ-001, REQ-006] (scaffold) Create the `BreakdownLine`/`NetSalaryView` types and the `presentNetSalary` skeleton, throwing "not implemented" — `src/ui/net-salary-view.ts`

## Phase A — Tests (test-author)
- [x] T-010 [REQ-005] (test) `divideRoundHalfUp` rounds an exact half up (away from zero), rounds a value below half down, and returns the exact quotient for an even division — `tests/unit/money.test.ts`
- [x] T-011 [REQ-005] (test) `centsToNumber` converts a cents amount into the equivalent colón `number` for display — `tests/unit/money.test.ts`
- [x] T-012 [REQ-001, AC-001.1] (test) `parseGrossSalary` returns the `empty` error for an empty string and for a whitespace-only string — `tests/unit/gross-salary.test.ts`
- [x] T-013 [REQ-001, AC-001.2, AC-001.3] (test) `parseGrossSalary` returns the `not-a-number` error for `abc`, `Infinity` and `NaN` — `tests/unit/gross-salary.test.ts`
- [x] T-014 [REQ-001, AC-001.4] (test) `parseGrossSalary` returns the `negative` error for `-1` and accepts `-0` as zero — `tests/unit/gross-salary.test.ts`
- [x] T-015 [REQ-001, AC-001.5] (test) `parseGrossSalary` returns the `too-many-decimals` error for `1000.123` and accepts `1000.10` — `tests/unit/gross-salary.test.ts`
- [x] T-016 [REQ-001, AC-001.7] (test) `parseGrossSalary` trims surrounding whitespace and parses `0`, `500000` and `333333.33` into exact cents — `tests/unit/gross-salary.test.ts`
- [x] T-017 [REQ-002, AC-002.1, AC-002.2, AC-002.3, AC-002.4] (test) `calculateNetSalary`/`calculateContribution` compute SEM, IVM and LPT for gross salaries of 1,000,000.00, 500,000.00, 333,333.33 and 0.00 — `tests/unit/net-salary.test.ts`
- [x] T-018 [REQ-003, AC-003.1, AC-003.2, AC-003.3, AC-003.4, AC-003.5, AC-003.6, AC-003.7] (test) `calculateIncomeTax` applies the marginal 2026 brackets below and at the exempt threshold, at each spec example, exactly at each bracket's upper limit, and just above the exempt threshold (918,000.01 → 0.00) — `tests/unit/net-salary.test.ts`
- [x] T-019 [REQ-004, AC-004.1, AC-004.2, AC-004.3, AC-004.4, AC-004.5, AC-004.6] (test) `calculateNetSalary` sums total deductions and derives the net salary for gross salaries of 500,000.00, 1,000,000.00, 2,000,000.00, 5,000,000.00, 918,000.00 and 0.00 — `tests/unit/net-salary.test.ts`
- [x] T-020 [REQ-004, AC-004.7] (test) `calculateNetSalary` keeps `net + totalDeductions === gross` exactly across fixed edge values (0, 1, 3, 918,000.01, each bracket limit ± 1 cent, 10^15 colones) and about 1,000 values from a deterministic hand-written generator — `tests/unit/net-salary.test.ts`
- [x] T-021 [REQ-005, AC-005.1, AC-005.2] (test) `calculateNetSalary` rounds each deduction half up before deriving totals, for gross salaries of 3.00 (SEM 0.17, IVM 0.13, LPT 0.03) and 333,333.33 (total 36,099.99, net 297,233.34) — `tests/unit/net-salary.test.ts`
- [x] T-022 [NFR-002, AC-N002.1] (test) `calculateNetSalary` uses the exact 2026 rates/brackets and reports `legalYear: 2026` with `CURRENT_LEGAL_PARAMETERS`, and produces different amounts and year with a hand-written fake `LegalParameters`, in the same `it` that also asserts `LEGAL_PARAMETERS_2026` matches spec §6 (so the red check is legitimate) — `tests/unit/net-salary.test.ts`
- [x] T-023 [REQ-001, AC-001.1, AC-001.2, AC-001.3, AC-001.4, AC-001.5] (test) `presentNetSalary` returns `kind: 'error'` with the exact Spanish message and no `lines` for each invalid input (empty, `abc`, `Infinity`/`NaN`, `-1`, `1000.123`) — `tests/unit/net-salary-view.test.ts`
- [x] T-024 [REQ-001, AC-001.6] (test) `presentNetSalary` returns an error view with no `lines` when an invalid input follows a previous valid call (the presenter is stateless) — `tests/unit/net-salary-view.test.ts`
- [x] T-025 [REQ-006, AC-006.1, AC-006.2, AC-006.3, AC-006.4] (test) `presentNetSalary('1000000')` returns the 7 breakdown labels in the exact spec order, each amount formatted with `formatCRC`, the `legalYearNote` "Parámetros legales vigentes: 2026", and no label or note containing "(cálculo de rebajas pendiente)" — `tests/unit/net-salary-view.test.ts`
- [x] T-026 [NFR-002, AC-N002.1] (test) `presentNetSalary` changes the rate labels and the legal-year note when given a hand-written fake `LegalParameters` (e.g. year 2099) — `tests/unit/net-salary-view.test.ts`
- [x] T-027 [NFR-001, AC-N001.1] (test) Calling `presentNetSalary`/`calculateNetSalary` with recording fakes stubbed via `vi.stubGlobal` for `fetch`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`, `localStorage`, `sessionStorage`, `indexedDB` and the `document.cookie` setter triggers none of them — `tests/unit/privacy.test.ts`
- [x] T-028 [NFR-001, AC-006.4, AC-001.6] (test) Every file loaded via `import.meta.glob('../../src/**/*.ts', { query: '?raw', import: 'default', eager: true })` contains none of `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `localStorage`, `sessionStorage`, `indexedDB`, `document.cookie`; `src/main.ts` contains no "(cálculo de rebajas pendiente)" and uses `replaceChildren` — `tests/unit/privacy.test.ts`

## Phase B — Implementation (implementer)
- [ ] T-030 [REQ-005] (impl) Implement `divideRoundHalfUp` and `centsToNumber`, replacing the "not implemented" bodies — `src/domain/money.ts`
- [ ] T-031 [REQ-001] (impl) Implement `parseGrossSalary`: trim, finite-decimal validation, sign check and exact parsing into cents — `src/domain/gross-salary.ts`
- [ ] T-032 [REQ-002, REQ-003, REQ-004, REQ-005] (impl) Implement `calculateContribution`, `calculateIncomeTax` and `calculateNetSalary` (marginal brackets, rounded totals derived from rounded amounts) — `src/domain/net-salary.ts`
- [ ] T-033 [REQ-001, REQ-006] (impl) Implement `presentNetSalary`: map `parseGrossSalary` errors to `GROSS_SALARY_ERROR_MESSAGES`, and a valid result to the 7 ordered breakdown lines plus the legal-year note — `src/ui/net-salary-view.ts`
- [ ] T-034 [REQ-001, REQ-006, NFR-001] (impl) Wire `src/main.ts` to `presentNetSalary`: switch the input to `type="text"`/`inputmode="decimal"`, replace `<output id="result">` with `<section id="result" aria-live="polite">`, render the error/result view with `replaceChildren`, and remove the "(cálculo de rebajas pendiente)" placeholder — `src/main.ts`
- [ ] T-035 [REQ-006] (impl) Update `#result` styles for the `.breakdown` two-column list, `.error` message and `.legal-year` note, with the `Salario neto` row in bold — `src/style.css`

## Coverage matrix
| REQ / NFR | AC | Test tasks | Impl tasks |
|---|---|---|---|
| REQ-001 | AC-001.1 | T-012, T-023 | T-031, T-033 |
| REQ-001 | AC-001.2 | T-013, T-023 | T-031, T-033 |
| REQ-001 | AC-001.3 | T-013, T-023 | T-031, T-033 |
| REQ-001 | AC-001.4 | T-014, T-023 | T-031, T-033 |
| REQ-001 | AC-001.5 | T-015, T-023 | T-031, T-033 |
| REQ-001 | AC-001.6 | T-024, T-028 | T-033, T-034 |
| REQ-001 | AC-001.7 | T-016 | T-031 |
| REQ-002 | AC-002.1 | T-017 | T-032 |
| REQ-002 | AC-002.2 | T-017 | T-032 |
| REQ-002 | AC-002.3 | T-017 | T-032 |
| REQ-002 | AC-002.4 | T-017 | T-032 |
| REQ-003 | AC-003.1 | T-018 | T-032 |
| REQ-003 | AC-003.2 | T-018 | T-032 |
| REQ-003 | AC-003.3 | T-018 | T-032 |
| REQ-003 | AC-003.4 | T-018 | T-032 |
| REQ-003 | AC-003.5 | T-018 | T-032 |
| REQ-003 | AC-003.6 | T-018 | T-032 |
| REQ-003 | AC-003.7 | T-018 | T-032 |
| REQ-004 | AC-004.1 | T-019 | T-032 |
| REQ-004 | AC-004.2 | T-019 | T-032 |
| REQ-004 | AC-004.3 | T-019 | T-032 |
| REQ-004 | AC-004.4 | T-019 | T-032 |
| REQ-004 | AC-004.5 | T-019 | T-032 |
| REQ-004 | AC-004.6 | T-019 | T-032 |
| REQ-004 | AC-004.7 | T-020 | T-032 |
| REQ-005 | AC-005.1 | T-010, T-021 | T-030, T-032 |
| REQ-005 | AC-005.2 | T-021 | T-030, T-032 |
| REQ-006 | AC-006.1 | T-025 | T-033, T-034 |
| REQ-006 | AC-006.2 | T-025 | T-033, T-034 |
| REQ-006 | AC-006.3 | T-025 | T-033, T-034 |
| REQ-006 | AC-006.4 | T-025, T-028 | T-033, T-034 |
| NFR-001 | AC-N001.1 | T-027 | T-032, T-033, T-034 |
| NFR-002 | AC-N002.1 | T-022, T-026 | T-002, T-032, T-033 |
