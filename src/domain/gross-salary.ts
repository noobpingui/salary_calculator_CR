import type { Cents } from './money';

export type GrossSalaryError = 'empty' | 'not-a-number' | 'negative' | 'too-many-decimals';

export type ParseGrossSalaryResult =
  | { readonly ok: true; readonly grossCents: Cents }
  | { readonly ok: false; readonly error: GrossSalaryError };

export function parseGrossSalary(_raw: string): ParseGrossSalaryResult {
  throw new Error('not implemented');
}
