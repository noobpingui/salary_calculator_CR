/**
 * Test-only support helpers for the `[static]` acceptance criteria of spec 002 (REQ-001, REQ-006,
 * REQ-008, REQ-009, NFR-001, NFR-002, NFR-003). Parses `src/style.css` with `postcss` and exposes
 * small, composable checks: per-scheme design-token resolution, achromatic-color detection, WCAG
 * contrast and CSS duration parsing.
 *
 * Not collected by Vitest: it is not named `*.test.ts` (Art. P1.1).
 */
import postcss from 'postcss';
import type { AtRule, Declaration, Root as PostcssRoot, Rule } from 'postcss';

export type ColorScheme = 'light' | 'dark';

/** Flat map of custom-property name (without the leading `--`) to its raw declared value. */
export type TokenMap = Record<string, string>;

/** Parses stylesheet source text into a postcss AST. */
export function parseCss(source: string): PostcssRoot {
  return postcss.parse(source);
}

function isDarkSchemeMedia(atRule: AtRule): boolean {
  return atRule.name === 'media' && /prefers-color-scheme:\s*dark/i.test(atRule.params);
}

/** True when `atRule` is a `@media (prefers-reduced-motion: reduce)` block. */
export function isReducedMotionMedia(atRule: AtRule): boolean {
  return atRule.name === 'media' && /prefers-reduced-motion:\s*reduce/i.test(atRule.params);
}

/** True when `atRule` is a min-width breakpoint (the plan's `@media (min-width: 48rem)`). */
export function isMinWidthMedia(atRule: AtRule): boolean {
  return atRule.name === 'media' && /min-width/i.test(atRule.params);
}

/**
 * Custom-property declarations (`--name: value`) found in `:root` blocks for one scheme:
 * - `light`: only the top-level `:root` rule (not nested in any `@media`).
 * - `dark`: only `:root` rules nested inside a `prefers-color-scheme: dark` media query.
 */
export function extractRootDeclarations(root: PostcssRoot, scheme: ColorScheme): TokenMap {
  const tokens: TokenMap = {};
  root.walkRules(':root', (rule) => {
    const parent = rule.parent;
    const isTopLevel = parent === root;
    const isInDarkMedia = parent?.type === 'atrule' && isDarkSchemeMedia(parent as AtRule);
    if (scheme === 'light' && !isTopLevel) return;
    if (scheme === 'dark' && !isInDarkMedia) return;
    rule.walkDecls((decl) => {
      if (decl.prop.startsWith('--')) {
        tokens[decl.prop.slice(2)] = decl.value.trim();
      }
    });
  });
  return tokens;
}

/**
 * All tokens visible for a scheme: `light` is the base `:root` block; `dark` starts from the light
 * tokens and overrides them with whatever is redeclared under the dark media query (design tokens
 * that are not colors, e.g. motion or spacing, are expected to be scheme-independent).
 */
export function tokensForScheme(root: PostcssRoot, scheme: ColorScheme): TokenMap {
  const light = extractRootDeclarations(root, 'light');
  if (scheme === 'light') return light;
  const dark = extractRootDeclarations(root, 'dark');
  return { ...light, ...dark };
}

const VAR_PATTERN = /var\(\s*--([a-zA-Z0-9-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/;

/** Resolves `var(--name, fallback)` references against `tokens`, recursively up to `depth` levels. */
export function resolveValue(value: string, tokens: TokenMap, depth = 8): string {
  let current = value.trim();
  for (let i = 0; i < depth; i += 1) {
    const match = VAR_PATTERN.exec(current);
    if (!match) return current;
    const full = match[0];
    const name = match[1] ?? '';
    const fallback = match[2];
    const replacement = tokens[name] ?? fallback?.trim() ?? '';
    current =
      current.slice(0, match.index) + replacement + current.slice(match.index + full.length);
  }
  return current;
}

const ACHROMATIC_KEYWORDS = new Set([
  'black',
  'white',
  'gray',
  'grey',
  'silver',
  'gainsboro',
  'whitesmoke',
  'lightgray',
  'lightgrey',
  'darkgray',
  'darkgrey',
  'dimgray',
  'dimgrey',
  'transparent',
  'currentcolor',
  'inherit',
]);

/** Named colors that always have a hue and must never appear as a color value (spec §6, AC-001.3). */
export const CHROMATIC_NAMED_COLORS = [
  'red',
  'green',
  'blue',
  'purple',
  'yellow',
  'orange',
  'pink',
  'teal',
  'navy',
  'crimson',
];

function expandHex(hex: string): { r: number; g: number; b: number } {
  const doubled = hex.length === 3 || hex.length === 4 ? hex.replaceAll(/./g, (c) => c + c) : hex;
  return {
    r: Number.parseInt(doubled.slice(0, 2), 16),
    g: Number.parseInt(doubled.slice(2, 4), 16),
    b: Number.parseInt(doubled.slice(4, 6), 16),
  };
}

function normalizeChannel(value: string): number {
  return value.endsWith('%') ? Number(value.slice(0, -1)) : Number(value);
}

/** Whether a (already `var()`-resolved) color value is achromatic per spec section 6. */
export function isAchromatic(rawValue: string): boolean {
  const value = rawValue.trim();
  const lower = value.toLowerCase();
  if (lower === '') return true;
  if (ACHROMATIC_KEYWORDS.has(lower)) return true;

  const hexMatch = /^#([0-9a-f]{3,8})$/i.exec(value);
  if (hexMatch) {
    const { r, g, b } = expandHex(hexMatch[1] as string);
    return r === g && g === b;
  }

  const rgbMatch = /^rgba?\(\s*([\d.]+%?)[,\s]+([\d.]+%?)[,\s]+([\d.]+%?)/i.exec(value);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch as unknown as [string, string, string, string];
    return (
      normalizeChannel(r) === normalizeChannel(g) && normalizeChannel(g) === normalizeChannel(b)
    );
  }

  const hslMatch = /^hsla?\(\s*[\d.]+(?:deg)?[,\s]+([\d.]+)%/i.exec(value);
  if (hslMatch) return Number(hslMatch[1]) === 0;

  const oklchMatch = /^oklch\(\s*[\d.]+%?\s+([\d.]+)/i.exec(value);
  if (oklchMatch) return Number(oklchMatch[1]) === 0;

  const lchMatch = /^lch\(\s*[\d.]+%?\s+([\d.]+)/i.exec(value);
  if (lchMatch) return Number(lchMatch[1]) === 0;

  return false;
}

function toRgb(value: string): { r: number; g: number; b: number } {
  const trimmed = value.trim();
  const hexMatch = /^#([0-9a-f]{3,8})$/i.exec(trimmed);
  if (hexMatch) return expandHex(hexMatch[1] as string);
  const rgbMatch = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(trimmed);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch as unknown as [string, string, string, string];
    return { r: Number(r), g: Number(g), b: Number(b) };
  }
  if (trimmed.toLowerCase() === 'black') return { r: 0, g: 0, b: 0 };
  if (trimmed.toLowerCase() === 'white') return { r: 255, g: 255, b: 255 };
  throw new Error(`css-audit: cannot parse "${value}" as an RGB color for contrast`);
}

/** Relative luminance of an sRGB color per WCAG 2.x (0..1). */
export function relativeLuminance(value: string): number {
  const { r, g, b } = toRgb(value);
  const [rl, gl, bl] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** WCAG contrast ratio between two resolved colors (>= 1). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Parses a single CSS `<time>` token (`200ms`, `0.3s`) into milliseconds. Unparseable -> 0. */
export function parseDurationMs(token: string): number {
  const match = /^(-?[\d.]+)(ms|s)$/i.exec(token.trim());
  if (!match) return 0;
  const amount = Number(match[1]);
  return match[2]?.toLowerCase() === 's' ? amount * 1000 : amount;
}

/**
 * Sums every time-like token (`<number>ms|s`) found in one comma-separated segment of a
 * `transition`/`animation` shorthand value (duration + delay, in whichever order they appear), and
 * returns one total per segment. Used to check the ≤ 300ms budget (AC-008.1) regardless of shorthand
 * property order.
 */
export function transitionSegmentTotalsMs(value: string): number[] {
  return value.split(',').map((segment) => {
    const times = segment.match(/-?[\d.]+m?s\b/gi) ?? [];
    return times.reduce((sum, t) => sum + parseDurationMs(t), 0);
  });
}

/** Converts a `rem`/`em` (16px root) or `px` length to pixels. Unparseable -> `NaN`. */
export function toPixels(value: string): number {
  const trimmed = value.trim();
  const remMatch = /^(-?[\d.]+)rem$/.exec(trimmed);
  if (remMatch) return Number(remMatch[1]) * 16;
  const emMatch = /^(-?[\d.]+)em$/.exec(trimmed);
  if (emMatch) return Number(emMatch[1]) * 16;
  const pxMatch = /^(-?[\d.]+)px$/.exec(trimmed);
  if (pxMatch) return Number(pxMatch[1]);
  return Number.NaN;
}

/** Maps a `font-weight` value (keyword or number) to its numeric weight. */
export function fontWeightNumber(value: string): number {
  const v = value.trim().toLowerCase();
  if (v === 'normal') return 400;
  if (v === 'bold' || v === 'bolder') return 700;
  if (v === 'lighter') return 300;
  const n = Number(v);
  return Number.isNaN(n) ? 400 : n;
}

/** True when every comma-separated part of `selector` targets `tag` qualified by `className`. */
export function selectorTargets(selector: string, className: string, tag: string): boolean {
  return selector.split(',').some((part) => {
    const trimmed = part.trim();
    const targetsTag = new RegExp(
      `(^|[\\s>+~])${tag}(\\.[\\w-]+)*(\\[[^\\]]*\\])*(:[\\w-]+)*$`,
    ).test(trimmed);
    return trimmed.includes(`.${className}`) && targetsTag;
  });
}

export interface MediaContext {
  /** `null` means "not nested in any `@media` at-rule" (the stylesheet's base rules). */
  matches: (atRule: AtRule | null) => boolean;
}

export const BASE_CONTEXT: MediaContext = { matches: (atRule) => atRule === null };
export const MIN_WIDTH_CONTEXT: MediaContext = {
  matches: (atRule) => atRule !== null && isMinWidthMedia(atRule),
};

/**
 * Declarations of rules whose selector targets `tag` qualified by `className`, restricted to a
 * media context (base stylesheet or a specific `@media` block).
 */
export function declarationsForClassAndTag(
  root: PostcssRoot,
  className: string,
  tag: string,
  context: MediaContext = BASE_CONTEXT,
): Declaration[] {
  const results: Declaration[] = [];
  root.walkRules((rule: Rule) => {
    if (!selectorTargets(rule.selector, className, tag)) return;
    const parentAtRule = rule.parent?.type === 'atrule' ? (rule.parent as AtRule) : null;
    if (!context.matches(parentAtRule)) return;
    rule.walkDecls((decl) => {
      results.push(decl);
    });
  });
  return results;
}

/**
 * Declarations of rules where `className` is a class on the element the rule *itself* targets
 * (the rightmost compound selector of each comma-separated part), as opposed to a descendant. Use
 * this for rules like `.line--net { border-top: ... }`, as distinct from `.line--net dd { ... }`.
 */
export function declarationsForOwnClass(
  root: PostcssRoot,
  className: string,
  context: MediaContext = BASE_CONTEXT,
): Declaration[] {
  const results: Declaration[] = [];
  root.walkRules((rule: Rule) => {
    const matches = rule.selector.split(',').some((part) => {
      const tokens = part.trim().split(/\s+/);
      const last = tokens[tokens.length - 1] ?? '';
      return last.includes(`.${className}`);
    });
    if (!matches) return;
    const parentAtRule = rule.parent?.type === 'atrule' ? (rule.parent as AtRule) : null;
    if (!context.matches(parentAtRule)) return;
    rule.walkDecls((decl) => {
      results.push(decl);
    });
  });
  return results;
}

/** Last declared value for `prop` among `decls` (later rules win, approximating the cascade). */
export function lastValueFor(decls: Declaration[], prop: string): string | undefined {
  const matching = decls.filter((d) => d.prop.toLowerCase() === prop.toLowerCase());
  return matching.length > 0 ? matching[matching.length - 1]?.value : undefined;
}

/** All declarations of `prop` found anywhere in the stylesheet (any selector, any context). */
export function allDeclarationsOf(root: PostcssRoot, prop: string): Declaration[] {
  const results: Declaration[] = [];
  root.walkDecls(prop, (decl) => {
    results.push(decl);
  });
  return results;
}

const SYSTEM_FONT_ALLOWLIST = new Set([
  'system-ui',
  'ui-sans-serif',
  '-apple-system',
  'blinkmacsystemfont',
  'segoe ui',
  'roboto',
  'helvetica neue',
  'arial',
  'sans-serif',
]);

/** True when every family in a `font-family` value is in the system-font allowlist (AC-N001.3). */
export function isSystemFontStack(value: string): boolean {
  const families = value
    .split(',')
    .map((f) =>
      f
        .trim()
        .replace(/^["']|["']$/g, '')
        .toLowerCase(),
    )
    .filter((f) => f.length > 0);
  return families.length > 0 && families.every((f) => SYSTEM_FONT_ALLOWLIST.has(f));
}
