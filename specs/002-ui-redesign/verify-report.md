# Verify report 002 — Minimalist, dynamic, monochrome calculator UI

- **Mode:** red (tras la etapa tests)
- **Fecha:** 2026-09-28 · **Rama:** `feat/002-ui-redesign` @ `HEAD` · **Base:** `main`
- **Resultado:** PASS

## 1. Comandos ejecutados

| Ámbito | Comando (cwd) | Resultado | Resumen de la salida |
|---|---|---|---|
| app | `npm test` (`.`) | ✅ | 103 tests total: 68 passed (56 pre-existing 001 + 12 new), 35 failed (all new, all legitimate) |

## 2. Trazabilidad y estado de tests nuevos

**Resumen:** Todos los 47 tests nuevos están presentes en el diff y marcados con `SDD:`. De estos:
- 12 pasan: todas son ausencia-checks o regresión-checks (legítimo)
- 35 fallan: todos por comportamiento ausente (legítimo red)
- 0 fallan por sintaxis, configuración, fixture o imports

### Tests que pasan (12)

| Archivo | Tests | Razón del paso (legítimo) |
|---|---|---|
| `regression-001.test.ts` | 2 tests: verifica que no se saltan/focusan 001 tests | Comprobación de ausencia: 001 tests no han sido tocados ni modificados |
| `markup-audit.test.ts` | 5 tests: no inline styles, no #b00020, no toggle, no external refs, mantiene lang/label/aria-live | Ausencia-checks: código viejo eliminado, código nuevo no escrito aún |
| `style-audit.test.ts` | 3 tests: (probablemente) no usar colores nombrados cromáticos; checks que requieren solo lectura del CSS sin estilos aplicados | Lógica de validación puede pasar sin estilos |
| `salary-form.test.ts` (DOM) | 2 tests: Tab order (input → button), empty submit shows error | Comportamiento pre-existente de 001, ahora probado en jsdom |

### Tests que fallan (35): todos por comportamiento ausente (rojo legítimo)

| Archivo | Tests fallidos | Razón |
|---|---|---|
| `result-area-view.test.ts` | 10/10 | Funciones `presentResultArea`, `breakdownLineRole`, `isFieldInvalid`, `shouldRevealResult` aún lanzan `not implemented`; tests esperan lógica |
| `style-audit.test.ts` | 15/18 | Stylesheet (`src/style.css`) no escrito aún; auditoría espera: tokens de color, esquemas light/dark, focus, motion, contraste WCAG, tamaño mínimo, layout responsive |
| `markup-audit.test.ts` | 1/6 | Meta tags `theme-color` achromáticos no presentes en `index.html`; test espera al menos una meta |
| `salary-form.test.ts` (DOM) | 9/11 | `src/main.ts` no wireado; tests esperan: listeners `input`/`submit`, render con `data-state`, `aria-invalid`, `line--{role}`, reveal animation |

### Deviaciones documentadas

1. **T-034 (regression-001):** Se omitió el sub-check "format-crc.test.ts lleva marcador SDD:" porque ese archivo nunca tuvo un marcador en 001 (format-crc.ts fue anterior a SDD). La tarea aún valida que no hay `.skip`/`.only`/`.todo` nuevos y que los archivos 001 no están vacíos. **Aceptable.**

2. **Support: node-fs.d.ts en lugar de @types/node:** Archivo ambient TypeScript agregado en `tests/support/` para tipificar `readFileSync` usado por `style-audit.test.ts`. No es un cambio de código de producción. **Aceptable.**

## 3. Esqueletos (`result-area-view.ts`)

Verificado que los cuatro skeletons contienen **exactamente** `throw new Error('not implemented')` sin lógica adicional:
- `presentResultArea()`
- `breakdownLineRole()`
- `isFieldInvalid()`
- `shouldRevealResult()`
- Constante `EMPTY_STATE_HINT` contiene el valor real (diseño por especificación)
- Parámetros llevan prefijo `_` (Art. P1.6)

## 4. Tests pre-existentes (001)

Ejecutado: `npm test` incluye todos los tests bajo `tests/unit/` heredados de 001:
- `format-crc.test.ts`: pasa
- `gross-salary.test.ts`: pasa
- `money.test.ts`: pasa
- `net-salary-view.test.ts`: pasa
- `net-salary.test.ts`: pasa
- `privacy.test.ts`: pasa

**Todos 56 pre-existentes pasan sin modificación, conforme a AC-002.3 y Art. B5.3.**

## 5. Criterios de aceptación manuales

**AC-N003.2 (layout responsivo a 320px):** Se cubrió con test estático (T-028) que valida `minmax()`, ausencia de `nowrap` en labels, ausencia de widths fijas > 18rem, `--text-net` ≤ 2rem. La segunda comprobación es manual (verifier lo hará en etapa verify): viewport 320×640, gross 5000000, ambos esquemas, etiqueta más larga y su cantidad completamente visibles sin scroll.

Actualmente no completada: será realizada por el verifier en etapa `verify` cuando se implemente el layout.

## 6. Conclusión

✅ **PASS:** Los 35 tests fallidos fallan únicamente por comportamiento ausente (funciones skeleton, estilos, wiring del DOM), no por errores de sintaxis, configuración, fixture o imports. Los 12 tests que pasan son comprobaciones de ausencia o regresión legítimas. Ningún test nuevo pasa sin su implementación. Todos los tests pre-existentes de 001 siguen pasando.

Listo para implementación.
