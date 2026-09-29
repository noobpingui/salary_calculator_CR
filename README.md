# Net Salary Calculator — Costa Rica

A client-side web app that computes the **net monthly salary** of an employee in Costa Rica from their **gross
salary**, applying the mandatory deductions (CCSS / LPT worker social charges and salary income tax).

Live at **[salary.betofallas.dev](https://salary.betofallas.dev)**.

## Why this project exists

This project was built **exclusively to test [sdd-beto](https://github.com/noobpingui/sdd-beto)**, a Claude Code
plugin that implements a Spec-Driven Development (SDD) harness. The calculator is intentionally small and
self-contained: a real domain with real rules (legal rates, tax brackets, money rounding) that is simple enough to
run through the whole pipeline end to end and see where the harness helps and where it gets in the way.

### The sdd-beto harness

Every functional change goes through a fixed pipeline, with one stage at a time and an explicit human approval
("approved" / "yes") at the end of each stage:

```
spec → plan → tasks → tests (red) → implement → verify → review → docs → close
```

The harness is made of these parts:

| Part                  | What it does                                                                                                                                                                                                                                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Subagents (roles)** | One subagent per stage, each limited to its own role: `spec-writer`, `planner`, `task-breaker`, `test-author`, `implementer`, `verifier`, `reviewer` and `doc-keeper`. The main session only orchestrates.                                                                               |
| **Skills (commands)** | `/sdd-beto:init`, `new`, `run`, `status` and one command per stage (`spec`, `plan`, `tasks`, `test`, `implement`, `verify`, `review`, `docs`, `close`).                                                                                                                                  |
| **Constitution**      | Part I (base, shipped with the plugin): no functional change without a spec, role separation, human approval, traceability, strict TDD, git rules and a definition of done. Part II (`.sdd/constitution.md`) holds this project's own rules and can only tighten Part I, never relax it. |
| **Hooks (guards)**    | A `PreToolUse` guard that enforces the rules instead of trusting them: a role guard (each subagent may only write its own files), a stage guard (no production code without an approved spec and plan) and a git guard (no commits, pushes or branch switches from subagents).           |
| **State CLI**         | `sdd-state` keeps each feature's `state.json` (stage, approvals, events, commits, test snapshot) and checks the preconditions of every stage. The state is never edited by hand.                                                                                                         |
| **Templates**         | Fixed formats for `spec.md` (EARS requirements, Given/When/Then acceptance criteria), `plan.md`, `tasks.md`, `verify-report.md`, `review.md` and `docs-report.md`.                                                                                                                       |
| **Traceability**      | Every requirement (`REQ-NNN`) maps to acceptance criteria (`AC-NNN.M`), tasks (`T-NNN`) and tests tagged with `// SDD: REQ-… AC-…`, which the verifier checks.                                                                                                                           |
| **Lint ratchet**      | Fails only on lint violations that a feature introduces in the files it touched, so legacy warnings do not block new work.                                                                                                                                                               |

Project-side files: `.sdd/config.json` (scopes and commands), `.sdd/constitution.md` (Part II), `specs/NNN-slug/`
(each feature's artifacts and state) and `docs/decisions/` (ADRs).

### How it went

- **`001-net-salary`** (the calculator itself) went through the full pipeline, from spec to close.
- **`002-ui-redesign`** went through the pipeline up to verify. After seeing the result, the design was reworked
  (spec revision 2, the "Colilla" payslip look), then implemented and merged **outside** the pipeline under the
  constitution's exception for text and style changes (Art. B1.2). Its `state.json` records it as delivered outside
  the flow rather than closed, since the skipped stages were never approved.
- Deployment (S3 + CloudFront + GitHub Actions) was set up without the harness, as plain infrastructure work.

## The app

### Stack

| Tool                                              | Use                                           |
| ------------------------------------------------- | --------------------------------------------- |
| [TypeScript](https://www.typescriptlang.org/)     | Language (`strict` mode)                      |
| [Vite](https://vite.dev/)                         | Dev server and build                          |
| [Vitest](https://vitest.dev/) + jsdom             | Test runner (unit, static audits and DOM)     |
| [ESLint](https://eslint.org/) + typescript-eslint | Linter                                        |
| [Prettier](https://prettier.io/)                  | Code formatting                               |
| AWS S3 + CloudFront                               | Static hosting                                |
| GitHub Actions                                    | Deploy on every push to `main` (via AWS OIDC) |

No framework and no backend: all computation happens in the browser, and salary data is never sent anywhere or
stored. The fonts (Figtree and Courier Prime) are self-hosted, so the page loads nothing from third parties.

### Requirements

- Node.js >= 20.19
- npm >= 10

### Quick start

```bash
npm install
npm run dev      # opens the app at http://localhost:5173
```

### Scripts

| Command                | Description                              |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Dev server with hot reload               |
| `npm run build`        | Type-checks and builds into `dist/`      |
| `npm run preview`      | Serves the production build locally      |
| `npm test`             | Runs the tests once                      |
| `npm run test:watch`   | Runs the tests in watch mode             |
| `npm run lint`         | Runs ESLint                              |
| `npm run lint:fix`     | Runs ESLint and fixes what it can        |
| `npm run format`       | Formats the code with Prettier           |
| `npm run format:check` | Checks formatting without changing files |
| `npm run typecheck`    | Type-checks with `tsc`                   |

### Structure

```
.
├── index.html                # HTML entry point
├── src/
│   ├── main.ts               # UI bootstrap: reads the field and renders the payslip
│   ├── style.css             # "Colilla, night desk, paper" look
│   ├── assets/fonts/         # Self-hosted Figtree and Courier Prime, with their OFL licences
│   ├── domain/               # Pure calculation: parsing, money rounding, legal parameters, net salary
│   ├── ui/                   # Pure, DOM-free presenters (error messages, payslip content)
│   └── shared/               # Shared helpers (colón formatting)
├── tests/
│   ├── unit/                 # Unit tests and static style/markup audits (*.test.ts)
│   ├── dom/                  # DOM tests with jsdom
│   └── support/              # Test-only helpers
├── specs/                    # SDD artifacts per feature (spec, plan, tasks, reports, state)
├── docs/decisions/           # Architecture decision records (ADRs)
├── .sdd/                     # sdd-beto config and project constitution (Part II)
├── .github/workflows/        # Deploy workflow (build, test, upload to S3, invalidate CloudFront)
├── eslint.config.js
├── vite.config.ts            # Vite and Vitest configuration
└── tsconfig.json
```
