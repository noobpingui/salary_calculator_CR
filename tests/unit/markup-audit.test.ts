import { describe, expect, it } from 'vitest';
import { isAchromatic } from '../support/css-audit';

const htmlFiles = import.meta.glob('../../index.html', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const sourceFiles = import.meta.glob('../../src/**/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const indexHtml = Object.values(htmlFiles)[0];
if (indexHtml === undefined) throw new Error('index.html should be found by the glob');

function findMainTs(): string {
  const entry = Object.entries(sourceFiles).find(([path]) => path.endsWith('/main.ts'));
  if (entry === undefined) throw new Error('src/main.ts should be found by the glob');
  return entry[1];
}

const mainTs = findMainTs();

describe('markup — monochrome palette, no inline styles (REQ-001)', () => {
  // SDD: REQ-001 AC-001.1
  it('has no style attribute and no .style. usage in index.html or the markup src/main.ts produces', () => {
    expect(indexHtml).not.toMatch(/\sstyle\s*=/i);
    expect(mainTs).not.toMatch(/\sstyle\s*=/i);
    expect(mainTs).not.toContain('.style.');
  });

  // SDD: REQ-001 AC-001.1
  it('declares only achromatic theme-color meta values', () => {
    const themeColorMatches = [
      ...indexHtml.matchAll(/<meta\s+name=["']theme-color["']\s+content=["']([^"']+)["']/gi),
    ];
    expect(themeColorMatches.length, 'expected at least one theme-color meta tag').toBeGreaterThan(
      0,
    );
    for (const match of themeColorMatches) {
      expect(isAchromatic(match[1] ?? '')).toBe(true);
    }
  });

  // SDD: REQ-001 AC-001.2
  it('never uses the previous red error color #b00020', () => {
    expect(indexHtml).not.toContain('#b00020');
    for (const [path, content] of Object.entries(sourceFiles)) {
      expect(content, `${path} should not contain #b00020`).not.toContain('#b00020');
    }
  });
});

describe('markup — no color-scheme toggle or stored preference (REQ-009)', () => {
  // SDD: REQ-009 AC-009.2
  it('has exactly one button (Calcular) and no scheme-switching control or storage of a preference', () => {
    const buttonMatches = mainTs.match(/<button\b/gi) ?? [];
    expect(buttonMatches).toHaveLength(1);
    expect(mainTs).not.toContain('matchMedia(');
    expect(mainTs).not.toContain('localStorage');
    expect(mainTs).not.toContain('sessionStorage');
    expect(mainTs.toLowerCase()).not.toContain('toggle');
  });
});

describe('markup — privacy and no external resources (NFR-001)', () => {
  // SDD: NFR-001 AC-N001.2
  it('references no external origin in index.html or the markup src/main.ts produces', () => {
    for (const content of [indexHtml, mainTs]) {
      expect(content).not.toContain('http://');
      expect(content).not.toContain('https://');
      expect(content).not.toMatch(/(?:src|href)\s*=\s*["']\s*\/\//i);
    }
  });
});

describe('markup — accessibility (NFR-002)', () => {
  // SDD: NFR-002 AC-N002.4
  it('keeps the es-CR document language, the field label and the polite live region', () => {
    expect(indexHtml).toMatch(/<html[^>]*\blang=["']es-CR["']/i);
    expect(mainTs).toContain('Salario bruto mensual (CRC)');
    expect(mainTs).toMatch(/aria-live=["']polite["']/i);
  });
});
