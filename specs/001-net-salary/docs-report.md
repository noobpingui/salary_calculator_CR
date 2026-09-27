# Docs report 001 — Net monthly salary from gross salary (CCSS, LPT and income tax)

## 1. Files updated

| File | What changed | Reason (linked to spec/diff) |
|---|---|---|
| `README.md` | Replaced the "walking skeleton" status note (which said the deduction calculation was pending) with a short description of what the calculator now does (CCSS SEM/IVM, LPT and progressive income tax, net salary in colones). Added `src/domain/` and `src/ui/` to the "Estructura" tree, in place of the removed placeholder. | The feature removes the `(cálculo de rebajas pendiente)` placeholder and adds the domain/presenter modules (spec AC-006.4; plan §2, new files `src/domain/*.ts`, `src/ui/net-salary-view.ts`); the README's visible-functionality and structure sections must reflect that. |
| `CLAUDE.md` (Proyecto section only) | Updated the **UI** area to mention `src/ui/net-salary-view.ts` as the new pure presenter. Updated the **Domain** area: removed "(planned)" and listed the four modules that now exist (`money.ts`, `legal-parameters.ts`, `gross-salary.ts`, `net-salary.ts`). | The feature implements the domain layer that this section previously described as "planned" and adds a new `src/ui/` presenter area (plan §2 Architecture impact table). Kept brief, no other part of `CLAUDE.md` touched. |

## 2. Documentation reviewed and left untouched

| File | Reason for not touching it |
|---|---|
| `docs/decisions/ADR-0001-money-as-bigint-cents.md`, `docs/decisions/README.md` | These are ADRs, under `paths.adr` in `.sdd/config.json`, not `paths.docs`. Out of scope for doc-keeper even though the `docs/**` glob would otherwise match them. Review finding F4 (ADR-0001 still `Proposed`) is listed as a follow-up below, owned by the `planner`, not doc-keeper. |
| `**/.env.example` | No `.env.example` file exists in the repository, and this feature introduces no environment variables (plan §7, Art. B6: "no secrets and no new environment variables"; confirmed by `git diff main...HEAD`, which touches no env/config files). Nothing to create or update. |
| Rest of `CLAUDE.md` (SDD, Aprobación humana, Convenciones sections) | Outside the "Proyecto" section (between the `sdd-beto:proyecto:start`/`end` markers), which is the only part doc-keeper may edit; none of those sections describe project-specific functionality affected by this feature. |
| `specs/001-net-salary/spec.md`, `plan.md`, `tasks.md`, `review.md`, `verify-report.md`, `state.json`, `idea.md` | SDD artifacts, not documentation; explicitly out of scope for doc-keeper. |

## 3. Follow-ups (deferred review findings)

Per `state.json` history ("Review findings F1-F5 deferred as follow-ups") and `review.md` §5, the user chose to defer
the following findings from the APPROVED review instead of fixing them before docs/close. They are **not** addressed
by this docs pass (none of them are documentation tasks for doc-keeper, except where noted) and are recorded here so
they are not lost:

| # | Severity | File:line | Finding | Owner |
|---|---|---|---|---|
| F1 | MINOR | `tests/unit/net-salary-view.test.ts:9-48, 58-61` | Error-view tests for AC-001.1–AC-001.5 assert `message` against `GROSS_SALARY_ERROR_MESSAGES.<key>`, the same constant the production code returns — tautological for the literal Spanish text. Suggested fix: assert the four literal strings from spec §6 directly. | test-author |
| F2 | NIT | `tests/unit/gross-salary.test.ts:57,62` | Two tests carry the marker `SDD: REQ-001 AC-001.7` but actually cover REQ-001 in general, not specifically the whitespace behavior of AC-001.7; `// SDD: REQ-001` would be the accurate marker. | test-author |
| F3 | NIT | `src/domain/gross-salary.ts:22` | The sign check `Number(trimmed) < 0` can misclassify an extreme negative value with hundreds of leading fractional zeros as `too-many-decimals` instead of `negative` (still rejected, never coerced; negligible impact). A string-based check, as in plan §3.3 step 3, would match the plan literally. | implementer |
| F4 | NIT | `docs/decisions/ADR-0001-money-as-bigint-cents.md:3`, `docs/decisions/README.md:5` | ADR-0001 is still `Proposed` although the plan that adopts it was approved and implemented; its rounding formula example also differs syntactically (though not semantically) from `money.ts`. Suggested: update status to `Accepted` and align the formula note. **Note:** this is an ADR under `paths.adr`, out of doc-keeper's scope; owner is `planner`. | planner |
| F5 | NIT | `src/main.ts:12`, `src/main.ts:44` | The error `<p role="alert">` is nested inside a `<section aria-live="polite">`, which may cause some screen readers to announce the error message twice. | planner |

## 4. Conclusion

Updated `README.md` (status note + project structure) and the Proyecto section of `CLAUDE.md` (Domain area no longer
"planned"; new `src/ui/` presenter area) to reflect the domain and presenter modules this feature added. No
`.env.example` changes were needed (no new environment variables). ADRs and other SDD artifacts were left untouched
as they are outside doc-keeper's scope. Review findings F1–F5, deferred by the user, are recorded above as
follow-ups for their respective owners (`test-author`, `implementer`, `planner`).
