/**
 * Minimal ambient typing for the one Node builtin the test-only static audits need
 * (`node:fs`'s `readFileSync`, to read `src/style.css` as text bypassing Vitest's default CSS-to-empty-module
 * transform — see `tests/unit/style-audit.test.ts`). The project has no `@types/node`; this avoids adding it
 * just for a single function used only by tests.
 */
declare module 'node:fs' {
  export function readFileSync(path: string | URL, encoding: 'utf-8' | 'utf8'): string;
}
