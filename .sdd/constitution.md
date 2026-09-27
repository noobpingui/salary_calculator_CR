# SDD Constitution · Part II: salary-calculator

> Rules **specific to this project**. They complement Part I (base), which lives in the `sdd-beto` plugin and is
> read by every agent together with this part. This part may **tighten** the base, never relax it.
>
> - Proposed by `/sdd-beto:init` from the existing code and approved by the user.
> - It only changes through a project ADR (in `paths.adr` of `.sdd/config.json`).
> - Keywords: **MUST** · **MUST NOT** · **SHOULD** (unless justified in writing in `plan.md`).
> - Cite each rule as `Art. P<n>.<m>`.

## Art. P1 — Test conventions

### app

1. Tests **MUST** live under `tests/` and be named `*.test.ts`; Vitest only collects `tests/**/*.test.ts`.
   Unit tests go in `tests/unit/`, mirroring the `src/` path of the module under test
   (e.g. `src/shared/format-crc.ts` → `tests/unit/format-crc.test.ts`).
2. Tests **MUST** import `describe`, `it` and `expect` explicitly from `vitest` (no globals) and import production
   code through relative paths into `src/`.
3. Tests run in the `node` environment, without a DOM. Tests **MUST NOT** depend on `document`/`window`;
   UI behavior is covered by testing the pure logic it calls. Adding a DOM environment (jsdom/happy-dom) requires
   an explicit task in `plan.md`.
4. Tests **MUST NOT** perform network calls. Dependencies are isolated with hand-written fakes passed as
   parameters; `vi.mock` of modules **SHOULD NOT** be used.
5. Test names (`describe`/`it`) **MUST** be written in English and describe the expected behavior.
6. Skeleton shape (Art. B5.6):
   `export function name(_param: Type): ReturnType { throw new Error("not implemented"); }`.
   Classes: the constructor stores its dependencies without throwing; each method throws
   `new Error("not implemented")`. The `_` prefix triggers `@typescript-eslint/no-unused-vars` until
   implemented; this is accepted because `lint`/`lint_ratchet` are enforced at `verify`, when skeletons no
   longer exist.

## Art. P2 — Architecture and conventions

### app

1. `src/main.ts` is the UI entry point: it **MUST** only read input, call domain functions and render results.
   Salary calculation logic (deductions, tax brackets, net salary) **MUST NOT** live in `src/main.ts`.
2. Calculation logic **SHOULD** live in pure, side-effect-free modules under `src/domain/`, with no access to the
   DOM, so that it runs in the `node` test environment.
3. Cross-cutting helpers live in `src/shared/`. Currency formatting **MUST** reuse `formatCRC`
   (`src/shared/format-crc.ts`); no other currency formatter may be introduced.
4. TypeScript runs in `strict` mode with `noUncheckedIndexedAccess`; `any` **MUST NOT** be used and the compiler
   options **MUST NOT** be relaxed.
5. Legal parameters that change over time (rates, brackets, thresholds) **SHOULD** be declared as named constants
   in a single module, citing the legal source and the year they apply to, never as magic numbers inline.

### General

1. User-facing text is in Spanish (Costa Rica, `es-CR`); code identifiers, comments and tests are in English.
2. Code **MUST** follow the Prettier configuration (`.prettierrc.json`).

## Art. P3 — Security

1. The app is client-side only: it **MUST NOT** send the user's salary data to any server or third-party service,
   nor persist it, unless a spec explicitly requires it.
2. User input **MUST** be validated before calculating (finite number, not negative); invalid input is reported
   to the user, never silently coerced.
3. User-provided values **MUST NOT** be inserted into the DOM via `innerHTML`; use `textContent`.

## Art. P4 — Additions to the definition of "done"

- [ ] `npm run format:check` passes.
