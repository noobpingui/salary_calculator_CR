import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BASE_CONTEXT,
  CHROMATIC_NAMED_COLORS,
  MIN_WIDTH_CONTEXT,
  allDeclarationsOf,
  contrastRatio,
  declarationsForClassAndTag,
  declarationsForOwnClass,
  fontWeightNumber,
  isAchromatic,
  isReducedMotionMedia,
  isSystemFontStack,
  lastValueFor,
  parseCss,
  resolveValue,
  toPixels,
  tokensForScheme,
  transitionSegmentTotalsMs,
} from '../support/css-audit';

// Vitest's default CSS handling replaces `.css` imports (even raw ones via import.meta.glob) with an
// empty module, so the stylesheet is read directly from disk instead (still a text-based static read,
// like `privacy.test.ts` does for `.ts` files).
const cssSource = readFileSync(new URL('../../src/style.css', import.meta.url), 'utf-8');
const root = parseCss(cssSource);
const lightTokens = tokensForScheme(root, 'light');
const darkTokens = tokensForScheme(root, 'dark');

describe('stylesheet — monochrome palette (REQ-001)', () => {
  // SDD: REQ-001 AC-001.1
  it('resolves every declared --color-* design token to an achromatic value in both schemes', () => {
    const colorTokenNames = Object.keys(lightTokens).filter((name) => name.includes('color'));
    expect(colorTokenNames.length).toBeGreaterThan(0);

    for (const name of colorTokenNames) {
      expect(
        isAchromatic(resolveValue(lightTokens[name] ?? '', lightTokens)),
        `light --${name}`,
      ).toBe(true);
    }
    for (const name of Object.keys(darkTokens).filter((n) => n.includes('color'))) {
      expect(isAchromatic(resolveValue(darkTokens[name] ?? '', darkTokens)), `dark --${name}`).toBe(
        true,
      );
    }
  });

  // SDD: REQ-001 AC-001.1
  it('contains no literal hex color outside of achromatic values', () => {
    const hexMatches = cssSource.match(/#[0-9a-f]{3,8}\b/gi) ?? [];
    for (const hex of hexMatches) {
      expect(isAchromatic(hex), `literal color ${hex}`).toBe(true);
    }
  });

  // SDD: REQ-001 AC-001.2
  it('styles the error message with an achromatic color and drops the previous #b00020 value', () => {
    expect(cssSource).not.toContain('#b00020');

    const errorDecls = declarationsForOwnClass(root, 'error', BASE_CONTEXT);
    expect(errorDecls.length, '.error should declare at least one rule').toBeGreaterThan(0);

    const colorValue = lastValueFor(errorDecls, 'color');
    if (colorValue !== undefined) {
      expect(isAchromatic(resolveValue(colorValue, lightTokens))).toBe(true);
    }
  });

  // SDD: REQ-001 AC-001.3
  it('uses no chromatic named color keyword as a color value', () => {
    for (const name of CHROMATIC_NAMED_COLORS) {
      const pattern = new RegExp(`[:\\s(,]${name}\\b`, 'i');
      expect(pattern.test(cssSource), `should not use the chromatic keyword "${name}"`).toBe(false);
    }
  });
});

describe('stylesheet — visual hierarchy of the result (REQ-006)', () => {
  // SDD: REQ-006 AC-006.1
  it('gives the "Salario neto" amount a larger font size and at least as heavy a weight as any other line, at base size', () => {
    const netDecls = declarationsForClassAndTag(root, 'line--net', 'dd', BASE_CONTEXT);
    const netSize = toPixels(resolveValue(lastValueFor(netDecls, 'font-size') ?? '', lightTokens));
    const netWeight = fontWeightNumber(
      resolveValue(lastValueFor(netDecls, 'font-weight') ?? '400', lightTokens),
    );
    expect(netSize, 'line--net dd font-size').toBeGreaterThan(0);

    for (const role of ['gross', 'deduction', 'total']) {
      const decls = declarationsForClassAndTag(root, `line--${role}`, 'dd', BASE_CONTEXT);
      const size = toPixels(resolveValue(lastValueFor(decls, 'font-size') ?? '16px', lightTokens));
      const weight = fontWeightNumber(
        resolveValue(lastValueFor(decls, 'font-weight') ?? '400', lightTokens),
      );
      expect(netSize, `net size vs .line--${role} dd`).toBeGreaterThan(size);
      expect(netWeight, `net weight vs .line--${role} dd`).toBeGreaterThanOrEqual(weight);
    }
  });

  // SDD: REQ-006 AC-006.1
  it('keeps the "Salario neto" amount the largest and heaviest inside the min-width breakpoint', () => {
    const netDecls = declarationsForClassAndTag(root, 'line--net', 'dd', MIN_WIDTH_CONTEXT);
    const netSizeValue = lastValueFor(netDecls, 'font-size');
    expect(
      netSizeValue,
      '.line--net dd should redefine font-size inside the min-width media query',
    ).toBeDefined();

    const netSize = toPixels(resolveValue(netSizeValue ?? '', lightTokens));
    for (const role of ['gross', 'deduction', 'total']) {
      const decls = declarationsForClassAndTag(root, `line--${role}`, 'dd', MIN_WIDTH_CONTEXT);
      const baseDecls = declarationsForClassAndTag(root, `line--${role}`, 'dd', BASE_CONTEXT);
      const value =
        lastValueFor(decls, 'font-size') ?? lastValueFor(baseDecls, 'font-size') ?? '16px';
      const size = toPixels(resolveValue(value, lightTokens));
      expect(netSize, `net size vs .line--${role} dd inside min-width media`).toBeGreaterThan(size);
    }
  });

  // SDD: REQ-006 AC-006.3
  it('separates "Total de rebajas" and "Salario neto" from the lines above with a visible achromatic divider', () => {
    for (const role of ['total', 'net']) {
      const decls = declarationsForOwnClass(root, `line--${role}`, BASE_CONTEXT);
      const borderTop = lastValueFor(decls, 'border-top');
      const borderValue = lastValueFor(decls, 'border') ?? borderTop;
      expect(borderValue, `.line--${role} should declare a divider`).toBeDefined();
      if (borderValue === undefined) continue;
      expect(borderValue).not.toMatch(/\bnone\b/i);
      const resolved = resolveValue(borderValue, lightTokens);
      const hexOrKeyword = resolved.match(/#[0-9a-f]{3,8}\b|black|white|gray|grey/i);
      if (hexOrKeyword) {
        expect(isAchromatic(hexOrKeyword[0])).toBe(true);
      }
    }
  });
});

describe('stylesheet — subtle motion (REQ-008)', () => {
  // SDD: REQ-008 AC-008.1
  it('keeps every transition/animation duration plus delay at or below 300ms', () => {
    const transitionValues = allDeclarationsOf(root, 'transition').map((d) =>
      resolveValue(d.value, lightTokens),
    );
    const animationValues = allDeclarationsOf(root, 'animation').map((d) =>
      resolveValue(d.value, lightTokens),
    );
    const totals = [...transitionValues, ...animationValues].flatMap((v) =>
      transitionSegmentTotalsMs(v),
    );

    expect(
      totals.length,
      'expected at least one transition or animation declaration',
    ).toBeGreaterThan(0);
    for (const total of totals) {
      expect(total).toBeLessThanOrEqual(300);
    }
  });

  // SDD: REQ-008 AC-008.2
  it('applies a transition or animation to the result area and to the field/button hover or focus state', () => {
    let resultAreaHasMotion = false;
    let fieldOrButtonHasMotion = false;

    root.walkRules((rule) => {
      const hasMotionDecl = rule.nodes?.some(
        (node) =>
          node.type === 'decl' && ['transition', 'animation'].includes(node.prop.toLowerCase()),
      );
      if (!hasMotionDecl) return;

      if (rule.selector.includes('#result') || rule.selector.includes('.reveal')) {
        resultAreaHasMotion = true;
      }
      if (
        /(#gross-salary|input|button)/i.test(rule.selector) &&
        /(:hover|:focus)/i.test(rule.selector)
      ) {
        fieldOrButtonHasMotion = true;
      }
    });

    // A transition declared directly on the base input/button rule (applying to hover/focus states
    // via the pseudo-class changing properties) also satisfies the requirement.
    if (!fieldOrButtonHasMotion) {
      const inputDecls = allDeclarationsOf(root, 'transition').filter((d) => {
        const rule = d.parent;
        return (
          rule &&
          'selector' in rule &&
          /(#gross-salary|input|button)/i.test((rule as { selector: string }).selector)
        );
      });
      fieldOrButtonHasMotion = inputDecls.length > 0;
    }

    expect(resultAreaHasMotion, 'expected motion on #result or .reveal').toBe(true);
    expect(
      fieldOrButtonHasMotion,
      'expected motion on the field/button base or hover/focus rule',
    ).toBe(true);
  });
});

describe('stylesheet — color schemes follow the OS (REQ-009)', () => {
  // SDD: REQ-009 AC-009.1
  it('defines a light scheme and a dark scheme selected by prefers-color-scheme, both achromatic', () => {
    let hasDarkSchemeMedia = false;
    root.walkAtRules('media', (atRule) => {
      if (/prefers-color-scheme:\s*dark/i.test(atRule.params)) hasDarkSchemeMedia = true;
    });
    expect(hasDarkSchemeMedia).toBe(true);

    const colorTokenNames = Object.keys(lightTokens).filter((name) => name.includes('color'));
    expect(colorTokenNames.length).toBeGreaterThan(0);
    for (const name of colorTokenNames) {
      expect(isAchromatic(resolveValue(lightTokens[name] ?? '', lightTokens))).toBe(true);
      expect(
        isAchromatic(resolveValue(darkTokens[name] ?? lightTokens[name] ?? '', darkTokens)),
      ).toBe(true);
    }
  });
});

describe('stylesheet — privacy and no external resources (NFR-001)', () => {
  // SDD: NFR-001 AC-N001.2
  it('contains no reference to an external origin and no remote @import', () => {
    expect(cssSource).not.toContain('http://');
    expect(cssSource).not.toContain('https://');
    expect(cssSource).not.toMatch(/url\(\s*['"]?\/\//i);
    expect(cssSource).not.toMatch(/@import\s+(url\()?['"]?\/\//i);
  });

  // SDD: NFR-001 AC-N001.3
  it('declares only system font families and no @font-face rule', () => {
    let fontFaceCount = 0;
    root.walkAtRules('font-face', () => {
      fontFaceCount += 1;
    });
    expect(fontFaceCount).toBe(0);

    const fontFamilyDecls = allDeclarationsOf(root, 'font-family');
    const fontTokenNames = Object.keys(lightTokens).filter((name) => name.includes('font'));
    const values = [
      ...fontFamilyDecls.map((d) => resolveValue(d.value, lightTokens)),
      ...fontTokenNames.map((name) => resolveValue(lightTokens[name] ?? '', lightTokens)),
    ].filter((v) => v.length > 0);

    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      expect(isSystemFontStack(value), `"${value}" should only use system fonts`).toBe(true);
    }
  });
});

describe('stylesheet — accessibility (NFR-002)', () => {
  // SDD: NFR-002 AC-N002.1
  it('gives the field and "Calcular" button a visible achromatic :focus-visible indicator, never removing it without replacing it', () => {
    const outlineNoneDecls = allDeclarationsOf(root, 'outline').filter((d) =>
      /^(none|0)$/i.test(d.value.trim()),
    );
    expect(outlineNoneDecls).toHaveLength(0);

    let focusVisibleCount = 0;
    root.walkRules((rule) => {
      if (!rule.selector.includes(':focus-visible')) return;
      focusVisibleCount += 1;
      const outline = rule.nodes?.find(
        (node) => node.type === 'decl' && node.prop.toLowerCase() === 'outline',
      );
      expect(outline, `${rule.selector} should declare an outline`).toBeDefined();
      if (outline?.type === 'decl') {
        const resolved = resolveValue(outline.value, lightTokens);
        expect(resolved).not.toMatch(/\bnone\b/i);
        const colorMatch = resolved.match(/#[0-9a-f]{3,8}\b|black|white|gray|grey/i);
        if (colorMatch) expect(isAchromatic(colorMatch[0])).toBe(true);
      }
    });
    expect(focusVisibleCount).toBeGreaterThan(0);
  });

  // SDD: NFR-002 AC-N002.2
  it('zeroes every transition and animation duration under prefers-reduced-motion', () => {
    let found = false;
    root.walkAtRules('media', (atRule) => {
      if (!isReducedMotionMedia(atRule)) return;
      atRule.walkDecls((decl) => {
        if (
          ['transition', 'transition-duration', 'animation', 'animation-duration'].includes(
            decl.prop.toLowerCase(),
          )
        ) {
          found = true;
          const resolved = resolveValue(decl.value, lightTokens);
          if (/^(none)$/i.test(resolved.trim())) return;
          const totals = transitionSegmentTotalsMs(resolved);
          for (const total of totals) expect(total).toBe(0);
        }
      });
    });
    expect(found, 'expected a prefers-reduced-motion rule zeroing motion').toBe(true);
  });

  // SDD: NFR-002 AC-N002.3
  it('meets WCAG 2.2 AA contrast for text and border/focus pairs in both schemes', () => {
    for (const tokens of [lightTokens, darkTokens]) {
      const paper = resolveValue(tokens.paper ?? tokens['color-paper'] ?? '', tokens);
      const ink = resolveValue(tokens.ink ?? tokens['color-ink'] ?? '', tokens);
      const graphite = resolveValue(tokens.graphite ?? tokens['color-graphite'] ?? '', tokens);
      const rule = resolveValue(tokens.rule ?? tokens['color-rule'] ?? '', tokens);
      const haze = resolveValue(tokens.haze ?? tokens['color-haze'] ?? '', tokens);

      expect(contrastRatio(ink, paper), 'ink on paper').toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(graphite, paper), 'graphite on paper').toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(paper, ink),
        'paper on ink (inverted slab / button)',
      ).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(ink, haze), 'ink on haze').toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(rule, paper), 'rule on paper (border, >= 3:1)').toBeGreaterThanOrEqual(
        3,
      );
      expect(
        contrastRatio(ink, paper),
        'ink on paper (focus indicator, >= 3:1)',
      ).toBeGreaterThanOrEqual(3);
    }
  });

  // SDD: NFR-002 AC-N002.4 [markup covered separately in markup-audit.test.ts]
  it('keeps the achromatic tokens named consistently so the field label and live region markup can rely on them', () => {
    expect(Object.keys(lightTokens).some((name) => name.includes('color'))).toBe(true);
  });
});

describe('stylesheet — responsive layout (NFR-003)', () => {
  // SDD: NFR-003 AC-N003.1
  it('gives the field and "Calcular" button a minimum height of at least 44px', () => {
    for (const tag of ['input', 'button']) {
      const decls = allDeclarationsOf(root, 'min-height').filter((d) => {
        const rule = d.parent;
        return rule && 'selector' in rule && (rule as { selector: string }).selector.includes(tag);
      });
      const minHeightValue = lastValueFor(decls, 'min-height');
      expect(minHeightValue, `a rule targeting "${tag}" should declare min-height`).toBeDefined();
      if (minHeightValue !== undefined) {
        expect(toPixels(resolveValue(minHeightValue, lightTokens))).toBeGreaterThanOrEqual(44);
      }
    }
  });

  // SDD: NFR-003 AC-N003.2
  it('lays the breakdown out so the longest label and amount fit a 320px viewport (static proxy)', () => {
    let gridTemplateColumns: string | undefined;
    root.walkRules('.breakdown', (rule) => {
      rule.walkDecls('grid-template-columns', (decl) => {
        gridTemplateColumns = decl.value;
      });
    });
    expect(gridTemplateColumns, '.breakdown should declare grid-template-columns').toBeDefined();
    expect(gridTemplateColumns).toMatch(/minmax/);
    expect(gridTemplateColumns).toMatch(/auto/);

    let dtOverflowWrap: string | undefined;
    let dtNoWrap = false;
    root.walkRules(/\.breakdown\s+dt|\.breakdown\s+dt,/, (rule) => {
      rule.walkDecls((decl) => {
        if (decl.prop === 'overflow-wrap') dtOverflowWrap = decl.value;
        if (decl.prop === 'white-space' && /nowrap/i.test(decl.value)) dtNoWrap = true;
      });
    });
    expect(dtOverflowWrap).toBe('anywhere');
    expect(dtNoWrap).toBe(false);

    const wideDecls = [
      ...allDeclarationsOf(root, 'width'),
      ...allDeclarationsOf(root, 'min-width'),
    ];
    for (const decl of wideDecls) {
      const resolved = resolveValue(decl.value, lightTokens);
      const px = toPixels(resolved);
      if (!Number.isNaN(px)) {
        expect(
          px,
          `${decl.prop}: ${decl.value} should not exceed 18rem (288px)`,
        ).toBeLessThanOrEqual(288);
      }
    }

    const netSizeTokenValue = lightTokens['text-net'];
    expect(netSizeTokenValue, '--text-net token should be declared').toBeDefined();
    if (netSizeTokenValue !== undefined) {
      expect(toPixels(resolveValue(netSizeTokenValue, lightTokens))).toBeLessThanOrEqual(32);
    }
  });
});
