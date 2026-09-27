import type { Cents } from './money';
import { divideRoundHalfUp } from './money';
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
export function calculateContribution(grossCents: Cents, basisPoints: number): Cents {
  return divideRoundHalfUp(grossCents * BigInt(basisPoints), 10_000n);
}

/** Marginal progressive tax on grossCents; the total is rounded half up to the cent once. */
export function calculateIncomeTax(
  grossCents: Cents,
  brackets: readonly IncomeTaxBracket[],
): Cents {
  let lower = 0n;
  let acc = 0n;

  for (const bracket of brackets) {
    const upper = bracket.upperLimitCents ?? grossCents;
    if (grossCents > lower) {
      const taxableInBracket = (grossCents < upper ? grossCents : upper) - lower;
      acc += taxableInBracket * BigInt(bracket.rateBasisPoints);
    }
    if (bracket.upperLimitCents === null) break;
    lower = upper;
  }

  return divideRoundHalfUp(acc, 10_000n);
}

export function calculateNetSalary(grossCents: Cents, params: LegalParameters): NetSalaryResult {
  const semCents = calculateContribution(grossCents, params.sem.basisPoints);
  const ivmCents = calculateContribution(grossCents, params.ivm.basisPoints);
  const lptCents = calculateContribution(grossCents, params.lpt.basisPoints);
  const incomeTaxCents = calculateIncomeTax(grossCents, params.incomeTax.brackets);
  const totalDeductionsCents = semCents + ivmCents + lptCents + incomeTaxCents;
  const netCents = grossCents - totalDeductionsCents;

  return {
    legalYear: params.year,
    grossCents,
    semCents,
    ivmCents,
    lptCents,
    incomeTaxCents,
    totalDeductionsCents,
    netCents,
  };
}
