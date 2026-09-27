<!-- sdd-beto:proyecto:start -->
## Proyecto

**salary-calculator** is a client-side web app that computes the **net monthly salary** of an employee in
Costa Rica from their **gross salary**, applying the mandatory deductions (CCSS / LPT worker social charges and
salary income tax).

### Areas
- **UI** (`src/main.ts`, `index.html`, `src/style.css`): a form where the user enters the gross salary and sees
  the result. User-facing text is in Spanish (`es-CR`).
- **Domain** (`src/domain/`, planned): pure calculation functions (deductions, tax brackets, net salary).
- **Shared** (`src/shared/`): cross-cutting helpers, e.g. `formatCRC` for colón formatting.

### Architecture
- TypeScript (strict) + Vite, no framework and no backend. All computation happens in the browser.
- The UI only reads input, calls domain functions and renders results; calculation logic stays out of
  `src/main.ts` (constitution Art. P2).
- Tests: Vitest in `node` environment under `tests/unit/`. Commands: see the scopes table in the Conventions
  section.

### Deployment
- Static build (`dist/`) produced by Vite. No deployment target is configured yet.

### Sensitive points
- Legal rates and income tax brackets change yearly (Ministerio de Hacienda decree); keep them as named
  constants with their source and year.
- Salary data is personal: it must not leave the browser nor be persisted.
- Money rounding: be explicit about where and how amounts are rounded to 2 decimals.
<!-- sdd-beto:proyecto:end -->

<!-- sdd-beto:sdd:start -->
## SDD

Este proyecto usa el plugin `sdd-beto` (Spec-Driven Development). Todo cambio funcional pasa por:

`spec → plan → tasks → tests (rojo) → implement → verify → review → docs → close`

- Cada etapa la hace un subagente `sdd-beto:<rol>`; la sesión principal orquesta y no hace el trabajo de los roles.
- Comandos: `/sdd-beto:new <slug> <idea>` crea una feature, `/sdd-beto:run [NNN-slug]` recorre el flujo, `/sdd-beto:status` muestra el estado y `/sdd-beto:<etapa>` ejecuta una sola etapa.
- Artefactos de cada feature: `specs/NNN-slug/`. Su estado vive en `state.json` y solo se cambia con la CLI `sdd-state` del plugin, nunca a mano.
- Configuración: `.sdd/config.json`. Constitución: la base del plugin más `.sdd/constitution.md` (Parte II, propia de este proyecto). Si chocan, gana la base.
- Decisiones del proyecto: `docs/decisions/`.
- Los hooks del plugin impiden editar código de producción fuera de una feature con spec y plan aprobados. Solo un hotfix o una excepción del Art. B1.2 justifica reiniciar con `SDD_BYPASS=1`.
<!-- sdd-beto:sdd:end -->

<!-- sdd-beto:aprobacion:start -->
## Aprobación humana

- Nada avanza sin un "aprobado" o "sí" explícito del usuario. El silencio, una pregunta o un "luego vemos" no son aprobación.
- Un gate por etapa: nunca se encadenan etapas ni se agrupan en una sola aprobación.
- Antes de cada `git commit`: se muestran los archivos, un resumen y el mensaje propuesto, y se espera la aprobación.
- Antes de cada `git push`: se muestran la rama de origen, la de destino y los commits, y se espera la aprobación.
- Los subagentes nunca hacen commit, push ni cambian de rama.
<!-- sdd-beto:aprobacion:end -->

<!-- sdd-beto:convenciones:start -->
## Convenciones

- **Idioma de los artefactos y de los mensajes al usuario:** `en`.
- **Ramas:** se parte de `main`; `feat/NNN-slug`, `fix/NNN-slug` y `refactor/NNN-slug`.
- **Commits:** idioma `en`, estilo "imperative, no conventional prefixes". Un commit por etapa aprobada. Nunca `--no-verify`, `git add -A` ni `push --force` a `main`.
- **Iteraciones de corrección** antes de escalar al usuario: 3.
- **Ámbitos** (`scopes` de `.sdd/config.json`):

| Ámbito | Raíz | Test | Lint | Typecheck | Build |
|---|---|---|---|---|---|
| `app` | `.` | `npm test` | `npm run lint` | `npm run typecheck` | `npm run build` |
<!-- sdd-beto:convenciones:end -->
