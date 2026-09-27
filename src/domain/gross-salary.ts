import type { Cents } from './money';

export type GrossSalaryError = 'empty' | 'not-a-number' | 'negative' | 'too-many-decimals';

export type ParseGrossSalaryResult =
  | { readonly ok: true; readonly grossCents: Cents }
  | { readonly ok: false; readonly error: GrossSalaryError };

/** Plain decimal notation only: optional sign, then digits with an optional fractional part. */
const VALID_DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

export function parseGrossSalary(raw: string): ParseGrossSalaryResult {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: false, error: 'empty' };
  }

  if (!VALID_DECIMAL.test(trimmed) || !Number.isFinite(Number(trimmed))) {
    return { ok: false, error: 'not-a-number' };
  }

  if (Number(trimmed) < 0) {
    return { ok: false, error: 'negative' };
  }

  const unsigned = trimmed.startsWith('+') || trimmed.startsWith('-') ? trimmed.slice(1) : trimmed;
  const [integerPartRaw = '', fractionRaw = ''] = unsigned.split('.');
  const integerPart = integerPartRaw === '' ? '0' : integerPartRaw;
  const fraction = fractionRaw.replace(/0+$/, '');

  if (fraction.length > 2) {
    return { ok: false, error: 'too-many-decimals' };
  }

  const fractionCents = fraction.padEnd(2, '0');
  const grossCents = BigInt(integerPart) * 100n + BigInt(fractionCents);
  return { ok: true, grossCents };
}
