/**
 * Minimal ambient typing for the one Node builtin the test-only static audits need
 * (`node:fs`'s `readFileSync` and `existsSync`, to read `src/style.css` as text bypassing Vitest's default CSS-to-empty-module
 * transform — see `tests/unit/style-audit.test.ts`). The project has no `@types/node`; this avoids adding it
 * just for functions used only by tests (`existsSync` checks the self-hosted font files exist).
 */
declare module 'node:fs' {
  export function readFileSync(path: string | URL, encoding: 'utf-8' | 'utf8'): string;
  export function existsSync(path: string | URL): boolean;
}
