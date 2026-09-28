import { describe, expect, it } from 'vitest';

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

describe('markup — single look (REQ-010)', () => {
  // SDD: REQ-010 AC-010.2
  it('declares a single theme colour and a single colour scheme, with no scheme-dependent attribute', () => {
    expect(indexHtml).not.toContain('prefers-color-scheme');
    const themeColors = [
      ...indexHtml.matchAll(/<meta\s+name=["']theme-color["']\s+content=["']([^"']+)["']/gi),
    ].map((match) => match[1]);
    expect(themeColors).toEqual(['#0b2624']);
    const schemes = [
      ...indexHtml.matchAll(/<meta\s+name=["']color-scheme["']\s+content=["']([^"']+)["']/gi),
    ].map((match) => match[1]);
    expect(schemes).toEqual(['dark']);
  });

  // SDD: REQ-010 AC-010.4
  it('has no look switch and no stored preference', () => {
    expect(mainTs.match(/<button\b/gi) ?? []).toHaveLength(1);
    for (const content of [indexHtml, ...Object.values(sourceFiles)]) {
      expect(content).not.toContain('matchMedia(');
      expect(content).not.toContain('localStorage');
      expect(content).not.toContain('sessionStorage');
      expect(content.toLowerCase()).not.toContain("toggle('theme");
    }
  });

  // SDD: REQ-010 AC-010.1
  it('has no inline styles', () => {
    expect(indexHtml).not.toMatch(/\sstyle\s*=/i);
    expect(mainTs).not.toMatch(/\sstyle\s*=/i);
    expect(mainTs).not.toContain('.style.');
  });
});

describe('markup — privacy and no external resources (NFR-001)', () => {
  // SDD: NFR-001 AC-N001.2
  it('references no external origin and no font service', () => {
    for (const content of [indexHtml, mainTs]) {
      expect(content).not.toContain('http://');
      expect(content).not.toContain('https://');
      expect(content).not.toMatch(/(?:src|href)\s*=\s*["']\s*\/\//i);
      expect(content).not.toMatch(/rel=["']preconnect["']/i);
      expect(content).not.toContain('fonts.googleapis');
    }
  });
});

describe('markup — accessibility (NFR-002)', () => {
  // SDD: NFR-002 AC-N002.4
  it('keeps the es-CR document language, the field label, the live region and a hidden ₡ prefix', () => {
    expect(indexHtml).toMatch(/<html[^>]*\blang=["']es-CR["']/i);
    expect(mainTs).toContain('<label for="gross-salary">Salario bruto mensual</label>');
    expect(mainTs).toMatch(/aria-live=["']polite["']/i);
    expect(mainTs).toMatch(/<span class="field__prefix" aria-hidden="true">₡<\/span>/);
  });

  // SDD: REQ-005
  it('renders results using replaceChildren in main.ts', () => {
    expect(mainTs).toContain('replaceChildren');
  });
});
