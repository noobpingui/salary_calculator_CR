# Spec 001 — Net monthly salary from gross salary (CCSS, LPT and income tax)

- **Feature:** `001-net-salary` · **Type:** feature
- **Scopes:** `app`

## 1. Context and problem

Employees in Costa Rica are paid a **gross monthly salary**. Mandatory deductions come out of it: the worker's
social security contributions (CCSS: health and maternity insurance "SEM", and disability, old age and death insurance "IVM"),
the worker's contribution to Banco Popular under the Ley de Protección al Trabajador ("LPT"), and the salary income tax
("impuesto sobre la renta"), which uses progressive monthly brackets set each year by a Ministerio de Hacienda decree.

Right now the app (a walking skeleton) accepts a gross salary and only echoes it back, with the message
"(cálculo de rebajas pendiente)". Without doing the maths by hand, the user cannot see how much they will actually
receive or how much each deduction takes.

This feature turns the existing form into a working calculator. It validates the gross salary, applies the
deductions in force for the configured legal year, and shows each deduction and the resulting net salary in colones.
Everything happens in the browser.

## 2. User story

As an **employee in Costa Rica (or an employer or accountant acting for one)**, I want **to enter a gross
monthly salary and see each mandatory deduction and the resulting net monthly salary** so that **I know what the
employee will actually receive and why**.

## 3. Scope

**Included:**
- Validating the gross monthly salary the user enters in the existing form.
- Calculating the worker's CCSS contributions (SEM and IVM) and the worker's LPT (Banco Popular) contribution as percentages of the gross salary.
- Calculating the monthly salary income tax with the progressive brackets of the configured legal year.
- Calculating total deductions and the net monthly salary.
- Showing the breakdown (gross, each deduction, total deductions, net) in colones, formatted `es-CR`, with the legal year the parameters apply to.
- Showing user-facing error messages in Spanish (`es-CR`) for invalid input.

**Out of scope:**
- Income tax credits for spouse and children ("créditos fiscales por cónyuge e hijos"); confirmed in Q4.
- The CCSS minimum contribution base ("base mínima contributiva") for low salaries; contributions always use the actual gross salary (Q5).
- Salary periods other than monthly (biweekly, weekly, hourly, annual) and the reverse calculation (net → gross).
- Aguinaldo, vacations, severance, overtime or other salary components.
- Self-employed workers, pensioners, voluntary deductions (associations, loans, garnishments) and employer charges.
- Choosing among several legal years; only one legal year (2026) applies at a time (Q1).
- Keeping or sharing calculations (history, export, links).

## 4. Functional requirements

Unless stated otherwise, the worked examples use the **2026 legal parameters** from section 6 (confirmed in
Q1–Q3).

### REQ-001 — Gross salary validation
IF the gross salary entered is empty, is not a finite number, is negative, or has more than 2 decimal places, THEN THE SYSTEM SHALL
not calculate, SHALL show the matching error message from section 6, and SHALL show no result breakdown.

- **AC-001.1:** Given an empty gross salary field, When the user submits the form, Then no calculation is produced and the error "Ingrese el salario bruto mensual." is returned.
- **AC-001.2:** Given the gross salary value `abc` (not a number), When the user submits, Then no calculation is produced and the error "El salario bruto debe ser un número válido." is returned.
- **AC-001.3:** Given the gross salary value `Infinity` or `NaN`, When the user submits, Then no calculation is produced and the error "El salario bruto debe ser un número válido." is returned.
- **AC-001.4:** Given the gross salary value `-1`, When the user submits, Then no calculation is produced and the error "El salario bruto no puede ser negativo." is returned.
- **AC-001.5:** Given the gross salary value `1000.123`, When the user submits, Then no calculation is produced and the error "El salario bruto admite como máximo 2 decimales." is returned.
- **AC-001.6:** Given a previous valid result is on screen, When the user submits an invalid value, Then the previous breakdown is no longer shown and only the error message is shown.
- **AC-001.7:** Given the gross salary value `  500000  ` (surrounding whitespace), When the user submits, Then the value is accepted as 500000.00 and no error is returned.

### REQ-002 — CCSS and LPT worker contributions
WHEN a valid gross salary is submitted THE SYSTEM SHALL calculate each worker contribution (CCSS SEM, CCSS IVM and
LPT Banco Popular) as its legal rate multiplied by the gross salary, rounded to 2 decimals (half-up, see REQ-005).

- **AC-002.1:** Given a gross salary of 1,000,000.00, When the salary is calculated, Then SEM = 55,000.00, IVM = 43,300.00 and LPT = 10,000.00.
- **AC-002.2:** Given a gross salary of 500,000.00, When the salary is calculated, Then SEM = 27,500.00, IVM = 21,650.00 and LPT = 5,000.00.
- **AC-002.3:** Given a gross salary of 333,333.33, When the salary is calculated, Then SEM = 18,333.33, IVM = 14,433.33 and LPT = 3,333.33.
- **AC-002.4:** Given a gross salary of 0.00, When the salary is calculated, Then SEM, IVM and LPT are all 0.00.

### REQ-003 — Monthly salary income tax
WHEN a valid gross salary is submitted THE SYSTEM SHALL calculate the monthly salary income tax on the gross salary, applying
the progressive brackets of the configured legal year marginally (each rate applies only to the portion of salary
within its bracket), and rounding the total tax to 2 decimals (half-up).

- **AC-003.1:** Given a gross salary of 500,000.00 (below the exempt threshold), When the salary is calculated, Then the income tax is 0.00.
- **AC-003.2:** Given a gross salary exactly equal to the exempt threshold (918,000.00), When the salary is calculated, Then the income tax is 0.00.
- **AC-003.3:** Given a gross salary of 1,000,000.00, When the salary is calculated, Then the income tax is 8,200.00 (10 % of 82,000.00).
- **AC-003.4:** Given a gross salary of 2,000,000.00, When the salary is calculated, Then the income tax is 140,850.00 (42,900.00 + 97,950.00).
- **AC-003.5:** Given a gross salary of 5,000,000.00, When the salary is calculated, Then the income tax is 736,300.00 (42,900.00 + 152,550.00 + 472,600.00 + 68,250.00).
- **AC-003.6:** Given a gross salary exactly equal to the upper limit of any bracket (1,347,000.00; 2,364,000.00; 4,727,000.00), When the salary is calculated, Then the income tax equals the sum of the full lower brackets only (42,900.00; 195,450.00; 668,050.00 respectively).
- **AC-003.7:** Given a gross salary of 918,000.01, When the salary is calculated, Then the income tax is 0.00 (0.001 rounds to 0.00).

### REQ-004 — Total deductions and net salary
WHEN a valid gross salary is submitted THE SYSTEM SHALL calculate the total deductions as the sum of the rounded SEM,
IVM, LPT and income tax amounts, and the net monthly salary as gross salary minus total deductions.

- **AC-004.1:** Given a gross salary of 500,000.00, When the salary is calculated, Then total deductions = 54,150.00 and net salary = 445,850.00.
- **AC-004.2:** Given a gross salary of 1,000,000.00, When the salary is calculated, Then total deductions = 116,500.00 and net salary = 883,500.00.
- **AC-004.3:** Given a gross salary of 2,000,000.00, When the salary is calculated, Then total deductions = 357,450.00 and net salary = 1,642,550.00.
- **AC-004.4:** Given a gross salary of 5,000,000.00, When the salary is calculated, Then total deductions = 1,277,800.00 and net salary = 3,722,200.00.
- **AC-004.5:** Given a gross salary of 918,000.00, When the salary is calculated, Then total deductions = 99,419.40 and net salary = 818,580.60.
- **AC-004.6:** Given a gross salary of 0.00, When the salary is calculated, Then total deductions = 0.00 and net salary = 0.00.
- **AC-004.7:** Given any valid gross salary, When the salary is calculated, Then net salary + total deductions equals the gross salary exactly (to the cent).

### REQ-005 — Money rounding
THE SYSTEM SHALL round each deduction (SEM, IVM, LPT, income tax) to 2 decimals using round half up (away from zero),
unaffected by binary floating-point representation errors, and SHALL derive totals and the net salary from the rounded amounts.

- **AC-005.1:** Given a gross salary of 3.00, When the salary is calculated, Then SEM = 0.17 (0.165 rounded half up, not 0.16), IVM = 0.13, LPT = 0.03, total deductions = 0.33 and net salary = 2.67.
- **AC-005.2:** Given a gross salary of 333,333.33, When the salary is calculated, Then total deductions = 36,099.99 and net salary = 297,233.34.

### REQ-006 — Result breakdown shown to the user
WHEN a valid gross salary is submitted THE SYSTEM SHALL show, in Spanish and in this order, the lines listed in section 6
("Result breakdown"), each amount formatted in colones with 2 decimals using the project's existing `es-CR` colón format, plus the legal year
the parameters apply to.

- **AC-006.1:** Given a gross salary of 1,000,000.00, When the result is produced, Then it contains, in this order, the labels "Salario bruto", "CCSS — Seguro de Enfermedad y Maternidad (5,50 %)", "CCSS — Invalidez, Vejez y Muerte (4,33 %)", "Banco Popular — LPT (1,00 %)", "Impuesto sobre la renta", "Total de rebajas" and "Salario neto", each with its amount from REQ-002..REQ-004.
- **AC-006.2:** Given a gross salary of 1,000,000.00, When the result is produced, Then the "Salario neto" amount is formatted exactly as the existing colón formatter formats 883,500 (e.g. contains `₡` and `883` … `500,00`).
- **AC-006.3:** Given any valid gross salary, When the result is produced, Then it includes the text "Parámetros legales vigentes: 2026".
- **AC-006.4:** Given any valid gross salary, When the result is produced, Then the text "(cálculo de rebajas pendiente)" no longer appears.

## 5. Non-functional requirements

### NFR-001 — Privacy of salary data
THE SYSTEM SHALL compute the result entirely in the browser, without sending the gross salary or any result to any
server or third party, and without persisting them (no cookies, local/session storage, or other storage).

- **AC-N001.1:** Given any valid gross salary, When the salary is calculated, Then no network request is attempted and nothing is written to browser storage during the calculation.

### NFR-002 — Traceable legal parameters
THE SYSTEM SHALL use the legal rates and income tax brackets of a single configured legal year, each identified by its legal source and year,
so that updating the year changes every calculation and the displayed year consistently.

- **AC-N002.1:** Given the configured legal year 2026, When any valid gross salary is calculated, Then the rates and brackets used are exactly those listed for 2026 in section 6 and the displayed year is 2026.

## 6. Visible data and contracts

**Input — "Salario bruto mensual (CRC)"** (existing field):
- Amount in colones, ≥ 0, finite, at most 2 decimal places. Leading/trailing whitespace is ignored. `0` is valid.
- No upper limit other than being a finite number (Q6).
- Calculated when the user presses "Calcular" (form submit), as the form does today.

**Error messages (Spanish, shown instead of the breakdown):**

| Condition | Message |
|---|---|
| Empty value (or only whitespace) | `Ingrese el salario bruto mensual.` |
| Not a finite number | `El salario bruto debe ser un número válido.` |
| Negative | `El salario bruto no puede ser negativo.` |
| More than 2 decimals | `El salario bruto admite como máximo 2 decimales.` |

**Legal parameters for 2026 (confirmed in Q1–Q3):**

| Concept | Worker rate / bracket | Source |
|---|---|---|
| CCSS — SEM (Seguro de Enfermedad y Maternidad) | 5.50 % of gross | CCSS, Reglamento del Seguro de Salud |
| CCSS — IVM (Invalidez, Vejez y Muerte) | 4.33 % of gross (from 2026-01-01) | CCSS, Reglamento del Seguro de IVM (graduated increase) |
| Banco Popular — LPT | 1.00 % of gross | Ley 7983 (LPT) / Ley Orgánica del Banco Popular |
| Income tax — bracket 1 | up to ₡918,000.00: 0 % | Ministerio de Hacienda decree, 2026 |
| Income tax — bracket 2 | over ₡918,000.00 up to ₡1,347,000.00: 10 % | idem |
| Income tax — bracket 3 | over ₡1,347,000.00 up to ₡2,364,000.00: 15 % | idem |
| Income tax — bracket 4 | over ₡2,364,000.00 up to ₡4,727,000.00: 20 % | idem |
| Income tax — bracket 5 | over ₡4,727,000.00: 25 % | idem |

- The tax base is the full gross monthly salary. CCSS/LPT contributions are **not** subtracted before tax.

**Result breakdown (Spanish labels, in order):**

| # | Label | Amount |
|---|---|---|
| 1 | `Salario bruto` | gross salary |
| 2 | `CCSS — Seguro de Enfermedad y Maternidad (5,50 %)` | SEM |
| 3 | `CCSS — Invalidez, Vejez y Muerte (4,33 %)` | IVM |
| 4 | `Banco Popular — LPT (1,00 %)` | LPT |
| 5 | `Impuesto sobre la renta` | income tax |
| 6 | `Total de rebajas` | SEM + IVM + LPT + income tax |
| 7 | `Salario neto` | gross − total deductions |

Followed by the note `Parámetros legales vigentes: 2026`. The rate shown in each label comes from the configured parameters.
All amounts use the existing `es-CR` colón format (symbol `₡`, 2 decimals).

## 7. Open questions

| # | Question | Default proposal | User's answer |
|---|---|---|---|
| Q1 | Which legal year should the calculation use, and do the 2026 income tax brackets in section 6 (₡918,000 / ₡1,347,000 / ₡2,364,000 / ₡4,727,000 at 0/10/15/20/25 %) match the official Hacienda decree? | Use 2026 only, with the brackets as listed in section 6. | accept all |
| Q2 | Is the worker IVM rate for 2026 4.33 % (graduated increase from 4.17 %), which makes total CCSS + LPT 10.83 %? | Yes: SEM 5.50 %, IVM 4.33 %, LPT 1.00 % (total 10.83 %). | accept all |
| Q3 | Should the LPT/Banco Popular 1 % appear as its own line or be grouped with CCSS as "cargas sociales"? | Its own line (as in section 6), with no subtotal for social charges. | accept all |
| Q4 | Should income tax credits for spouse and children be supported (extra inputs that lower the tax)? | No, out of scope for this feature; possible follow-up feature. | accept all |
| Q5 | Should the CCSS minimum contribution base apply when the gross salary is below it (contributions calculated on the minimum base instead of the actual salary)? | No: contributions always use the actual gross salary; out of scope. | accept all |
| Q6 | Should there be an upper limit on the gross salary, or a minimum greater than 0? | No: any finite value ≥ 0 is accepted, including 0. | accept all |
| Q7 | Should a value with more than 2 decimals be rejected, or rounded silently? | Reject with "El salario bruto admite como máximo 2 decimales." (Art. P3.2 forbids silent coercion). | accept all |
| Q8 | Should the income tax show its per-bracket breakdown, or one line only? | One line only ("Impuesto sobre la renta"). | accept all |
| Q9 | Rounding rule: each deduction rounded to 2 decimals half up, with totals derived from the rounded amounts? | Yes, as described in REQ-005. | accept all |

All questions Q1–Q9 are **resolved**: the user accepted every default proposal, and the requirements, acceptance
criteria and section 6 above already reflect them (2026 parameters and brackets, LPT as its own line, no tax credits,
no CCSS minimum base, no upper limit, rejection of more than 2 decimals, single income tax line, half-up rounding per
deduction).

## 8. Glossary

- **Gross salary (salario bruto):** monthly salary before deductions.
- **Net salary (salario neto):** gross salary minus all the deductions in this spec.
- **CCSS:** Caja Costarricense de Seguro Social.
- **SEM:** Seguro de Enfermedad y Maternidad (health and maternity insurance), worker's share.
- **IVM:** Seguro de Invalidez, Vejez y Muerte (pension insurance), worker's share.
- **LPT:** Ley de Protección al Trabajador; here, the worker's 1 % contribution to Banco Popular.
- **Legal year:** calendar year whose rates and tax brackets are used for the calculation.
- **Round half up:** rounding to 2 decimals where an exact half cent rounds away from zero (0.165 → 0.17).
