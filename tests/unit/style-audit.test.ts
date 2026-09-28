import { existsSync, readFileSync } from 'node:fs';
import type { AtRule, Declaration } from 'postcss';
import { describe, expect, it } from 'vitest';
import {
  allDeclarationsOf,
  contrastRatio,
  fontWeightNumber,
  isReducedMotionMedia,
  parseCss,
  parseDurationMs,
  resolveValue,
  toPixels,
  tokensForScheme,
} from '../support/css-audit';

// Vitest's default CSS handling replaces `.css` imports (even raw ones via import.meta.glob) with an
// empty module, so the stylesheet is read directly from disk instead.
const cssUrl = new URL('../../src/style.css', import.meta.url);
const cssSource = readFileSync(cssUrl, 'utf-8');
const root = parseCss(cssSource);
const tokens = tokensForScheme(root, 'light');

/** Declarations of the base (not nested in `@media`) rules whose selector list contains `selector`. */
function declsFor(selector: string): Declaration[] {
  const results: Declaration[] = [];
  root.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && (rule.parent as AtRule).name === 'media') return;
    if (!rule.selectors.includes(selector)) return;
    rule.walkDecls((decl) => {
      results.push(decl);
    });
  });
  return results;
}

/** Resolved value of the last `prop` declared for `selector`. */
function valueFor(selector: string, prop: string): string | undefined {
  const matching = declsFor(selector).filter((d) => d.prop === prop);
  const last = matching[matching.length - 1];
  return last === undefined ? undefined : resolveValue(last.value, tokens);
}

/** Smallest size a `clamp(min, preferred, max)` (or plain length) can compute to, in pixels. */
function minPixels(value: string): number {
  const clamp = /^clamp\(\s*([^,]+),/.exec(value.trim());
  return toPixels(clamp ? (clamp[1] ?? '') : value);
}

describe('stylesheet — single "night desk, paper" look (REQ-010)', () => {
  // SDD: REQ-010 AC-010.1
  it('defines the palette and paints the desk, glow, slip and field with it', () => {
    expect(tokens).toMatchObject({
      desk: '#0b2624',
      'desk-glow': '#133b38',
      paper: '#e9e3d3',
      'paper-ink': '#1f2826',
      'paper-muted': '#545f5c',
      focus: '#f2c14e',
      warn: '#ffd08a',
    });
    expect(cssSource).not.toContain('#5f6b68');

    expect(valueFor('body', 'background-color')).toBe('#0b2624');
    expect(valueFor('body', 'background-image')).toContain('#133b38');
    expect(valueFor('.slip', 'background')).toBe('#e9e3d3');
    expect(valueFor('.field', 'background')).toBe('#e9e3d3');
  });

  // SDD: REQ-010 AC-010.2
  it('has no colour-scheme-dependent rule', () => {
    expect(cssSource).not.toContain('prefers-color-scheme');
    expect(valueFor(':root', 'color-scheme')).toBe('dark');
  });

  // SDD: REQ-010 AC-010.5
  it('sets the desk in Figtree and the field value and slip in Courier Prime, with generic fallbacks', () => {
    const desk = valueFor(':root', 'font-family') ?? '';
    expect(desk).toMatch(/^'Figtree',.*\bsans-serif$/);

    for (const selector of ['.field input', '.slip']) {
      expect(valueFor(selector, 'font-family'), selector).toMatch(
        /^'Courier Prime',.*\bmonospace$/,
      );
    }

    // Nothing else overrides the family (headline, copy, label and error inherit the desk font).
    const families = allDeclarationsOf(root, 'font-family')
      .filter((decl) => decl.parent?.type === 'rule')
      .map((decl) => (decl.parent as { selector: string }).selector);
    expect(families.sort()).toEqual([':root', '.field__prefix,\n.field input', '.slip'].sort());
  });
});

describe('stylesheet — slip hierarchy and rules (REQ-006, REQ-011)', () => {
  // SDD: REQ-006 AC-006.1
  it('makes the net amount larger than any other row amount and bold, with a bold label', () => {
    const netSize = minPixels(valueFor('.row--net .amount', 'font-size') ?? '');
    const rowSize = toPixels(valueFor('.slip', 'font-size') ?? '');
    expect(netSize).toBeGreaterThan(rowSize);
    expect(
      fontWeightNumber(valueFor('.row--net .amount', 'font-weight') ?? ''),
    ).toBeGreaterThanOrEqual(700);
    expect(fontWeightNumber(valueFor('.row--net dt', 'font-weight') ?? '')).toBeGreaterThanOrEqual(
      700,
    );
    expect(valueFor('.amount', 'font-size')).toBeUndefined();
  });

  // SDD: REQ-006 AC-006.3 ; REQ-011 AC-011.5
  it('uses dotted leaders, dashed group rules and a double rule above the net line only', () => {
    expect(valueFor('.leader', 'border-bottom')).toMatch(/\bdotted\b/);
    expect(valueFor('.row--gross', 'border-bottom')).toMatch(/\bdashed\b/);
    expect(valueFor('.row--total', 'border-top')).toMatch(/\bdashed\b/);
    expect(valueFor('.row--net', 'border-top')).toMatch(/\bdouble\b/);

    const ruled = [] as string[];
    root.walkDecls(/^border/, (decl) => {
      if (/\b(dashed|double|dotted)\b/.test(decl.value)) {
        ruled.push((decl.parent as { selector: string }).selector);
      }
    });
    expect(ruled.sort()).toEqual(['.leader', '.row--gross', '.row--net', '.row--total']);
  });
});

describe('stylesheet — print motion (REQ-013)', () => {
  // SDD: REQ-013 AC-013.4
  it('animates only the slip print, within 600 ms, and keeps other transitions colour-only and ≤ 200 ms', () => {
    const keyframes: string[] = [];
    root.walkAtRules('keyframes', (atRule) => {
      keyframes.push(atRule.params);
    });
    expect(keyframes).toEqual(['print']);

    const animations = allDeclarationsOf(root, 'animation').filter(
      (decl) =>
        !(
          decl.parent?.parent?.type === 'atrule' &&
          isReducedMotionMedia(decl.parent.parent as AtRule)
        ),
    );
    expect(animations.map((decl) => (decl.parent as { selector: string }).selector)).toEqual([
      '.slip.print',
    ]);
    for (const decl of animations) {
      const times = decl.value.match(/-?[\d.]+m?s\b/g) ?? [];
      expect(times.reduce((sum, t) => sum + parseDurationMs(t), 0)).toBeLessThanOrEqual(600);
    }

    const allowed = new Set([
      'color',
      'background-color',
      'border-color',
      'box-shadow',
      'outline',
      'outline-color',
    ]);
    const transitions = allDeclarationsOf(root, 'transition').filter(
      (decl) => decl.value !== 'none !important' && !decl.important,
    );
    expect(transitions.length).toBeGreaterThan(0);
    for (const decl of transitions) {
      for (const segment of decl.value.split(',')) {
        const [property = '', ...rest] = segment.trim().split(/\s+/);
        expect(allowed.has(property), `transition property "${property}"`).toBe(true);
        const total = rest.reduce((sum, t) => sum + parseDurationMs(t), 0);
        expect(total).toBeLessThanOrEqual(200);
      }
    }
  });

  // SDD: REQ-013 AC-013.5 ; NFR-002 AC-N002.2
  it('disables every animation and transition under reduced motion', () => {
    const reduced: Declaration[] = [];
    root.walkAtRules('media', (atRule) => {
      if (!isReducedMotionMedia(atRule)) return;
      atRule.walkRules((rule) => {
        expect(rule.selectors).toEqual(['*', '*::before', '*::after']);
        rule.walkDecls((decl) => {
          reduced.push(decl);
        });
      });
    });
    const byProp = Object.fromEntries(reduced.map((decl) => [decl.prop, decl]));
    for (const prop of ['animation', 'transition']) {
      expect(byProp[prop]?.value, prop).toBe('none');
      expect(byProp[prop]?.important, prop).toBe(true);
    }
  });
});

describe('stylesheet — self-hosted fonts, no external resources (NFR-001)', () => {
  // SDD: NFR-001 AC-N001.2
  it('references no external origin and has no @import', () => {
    expect(cssSource).not.toMatch(/https?:\/\//);
    expect(cssSource).not.toMatch(/url\(\s*['"]?\/\//);
    expect(cssSource).not.toMatch(/@import/);
  });

  // SDD: NFR-001 AC-N001.4
  it('declares only Courier Prime and Figtree, from relative paths to files that exist', () => {
    const families = new Set<string>();
    root.walkAtRules('font-face', (atRule) => {
      atRule.walkDecls((decl) => {
        if (decl.prop === 'font-family') families.add(decl.value.replaceAll("'", ''));
        if (decl.prop === 'src') {
          const urls = [...decl.value.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map(
            (m) => m[1] ?? '',
          );
          expect(urls.length).toBeGreaterThan(0);
          for (const url of urls) {
            expect(url).toMatch(/^\.\//);
            expect(existsSync(new URL(url, cssUrl)), url).toBe(true);
          }
        }
      });
    });
    expect([...families].sort()).toEqual(['Courier Prime', 'Figtree']);
  });

  // SDD: NFR-001 AC-N001.5
  it('ships the SIL Open Font License of each family next to the font files', () => {
    for (const file of ['OFL-Figtree.txt', 'OFL-CourierPrime.txt']) {
      const licence = readFileSync(
        new URL(`../../src/assets/fonts/${file}`, import.meta.url),
        'utf-8',
      );
      expect(licence, file).toContain('SIL Open Font License');
    }
  });
});

describe('stylesheet — accessibility (NFR-002)', () => {
  // SDD: NFR-002 AC-N002.1
  it('gives the field a visible amber focus indicator', () => {
    expect(valueFor('.field:focus-within', 'box-shadow')).toContain('#f2c14e');
    expect(valueFor('.field--invalid:focus-within', 'box-shadow')).toContain('#f2c14e');

    const removed: string[] = [];
    root.walkDecls('outline', (decl) => {
      if (/^(none|0)$/.test(decl.value))
        removed.push((decl.parent as { selector: string }).selector);
    });
    // The input's own outline is replaced by the ring on its `.field` container.
    expect(removed).toEqual(['.field input:focus']);
    expect(cssSource).not.toContain('.calc');
  });

  // SDD: NFR-002 AC-N002.3
  it('meets WCAG 2.2 AA contrast for the palette pairs', () => {
    const t = (name: string): string => tokens[name] ?? '';
    const normalText: Array<[string, string]> = [
      ['desk-ink', 'desk'],
      ['desk-ink', 'desk-glow'],
      ['desk-muted', 'desk'],
      ['desk-muted', 'desk-glow'],
      ['warn', 'desk'],
      ['warn', 'desk-glow'],
      ['paper-ink', 'paper'],
      ['paper-muted', 'paper'],
    ];
    for (const [fg, bg] of normalText) {
      expect(contrastRatio(t(fg), t(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
    for (const bg of ['desk', 'desk-glow']) {
      expect(contrastRatio(t('paper'), t(bg)), `paper field on ${bg}`).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(t('focus'), t(bg)), `focus on ${bg}`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('stylesheet — responsive layout (NFR-003)', () => {
  // SDD: NFR-003 AC-N003.1
  it('gives the field a minimum height of at least 44 px', () => {
    for (const selector of ['.field', '.field input']) {
      expect(toPixels(valueFor(selector, 'min-height') ?? ''), selector).toBeGreaterThanOrEqual(44);
    }
  });

  // SDD: NFR-003 AC-N003.2 [static proxy; the rendered check is in the screenshots]
  it('never breaks an amount and lets rows wrap instead of overflowing', () => {
    expect(valueFor('.amount', 'white-space')).toBe('nowrap');
    expect(valueFor('.row', 'flex-wrap')).toBe('wrap');
  });
});
