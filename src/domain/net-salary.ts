import type { Cents } from './money';
import type { IncomeTaxBracket, LegalParameters } from './legal-parameters';

export interface NetSalaryResult {
  readonly legalYear: number;
  readonly grossCents: Cents;
  readonly semCents: Cents;
  readonly ivmCents: Cents;
  readonly lptCents: Cents;
  readonly incomeTaxCents: Cents;
  readonly totalDeductionsCents: Cents;
  readonly netCents: Cents;
}

/** grossCents × basisPoints / 10 000, rounded half up to the cent. */
export function calculateContribution(_grossCents: Cents, _basisPoints: number): Cents {
  throw new Error('not implemented');
}

/** Marginal progressive tax on grossCents; the total is rounded half up to the cent once. */
export function calculateIncomeTax(
  _grossCents: Cents,
  _brackets: readonly IncomeTaxBracket[],
): Cents {
  throw new Error('not implemented');
}

export function calculateNetSalary(_grossCents: Cents, _params: LegalParameters): NetSalaryResult {
  throw new Error('not implemented');
}
