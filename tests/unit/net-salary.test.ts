import { describe, expect, it } from 'vitest';
import type { Cents } from '../../src/domain/money';
import type { IncomeTaxBracket, LegalParameters } from '../../src/domain/legal-parameters';
import { CURRENT_LEGAL_PARAMETERS, LEGAL_PARAMETERS_2026 } from '../../src/domain/legal-parameters';
import {
  calculateContribution,
  calculateIncomeTax,
  calculateNetSalary,
} from '../../src/domain/net-salary';

/** 2026 income tax brackets from spec section 6, written by hand so this test does not depend on
 * `legal-parameters.ts` being correct (that is checked separately by the NFR-002 test below). */
const BRACKETS_2026: readonly IncomeTaxBracket[] = [
  { upperLimitCents: 91_800_000n, rateBasisPoints: 0 },
  { upperLimitCents: 134_700_000n, rateBasisPoints: 1000 },
  { upperLimitCents: 236_400_000n, rateBasisPoints: 1500 },
  { upperLimitCents: 472_700_000n, rateBasisPoints: 2000 },
  { upperLimitCents: null, rateBasisPoints: 2500 },
];

/** Deterministic seeded LCG generating pseudo-random non-negative cent amounts, up to 10^17 (10^15 colones). */
function generateCentsSample(count: number, seed: bigint): Cents[] {
  const a = 6_364_136_223_846_793_005n;
  const c = 1_442_695_040_888_963_407n;
  const modulus = 2n ** 64n;
  const rangeCents = 100_000_000_000_000_000n; // 10^17 cents = 10^15 colones
  let state = seed;
  const values: Cents[] = [];
  for (let i = 0; i < count; i++) {
    state = (a * state + c) % modulus;
    values.push(state % rangeCents);
  }
  return values;
}

describe('calculateContribution — CCSS and LPT worker contributions (REQ-002)', () => {
  // SDD: REQ-002 AC-002.1
  it('computes SEM, IVM and LPT for a gross salary of 1,000,000.00', () => {
    const grossCents = 100_000_000n;
    expect(calculateContribution(grossCents, 550)).toBe(5_500_000n);
    expect(calculateContribution(grossCents, 433)).toBe(4_330_000n);
    expect(calculateContribution(grossCents, 100)).toBe(1_000_000n);
  });

  // SDD: REQ-002 AC-002.2
  it('computes SEM, IVM and LPT for a gross salary of 500,000.00', () => {
    const grossCents = 50_000_000n;
    expect(calculateContribution(grossCents, 550)).toBe(2_750_000n);
    expect(calculateContribution(grossCents, 433)).toBe(2_165_000n);
    expect(calculateContribution(grossCents, 100)).toBe(500_000n);
  });

  // SDD: REQ-002 AC-002.3
  it('computes SEM, IVM and LPT for a gross salary of 333,333.33', () => {
    const grossCents = 33_333_333n;
    expect(calculateContribution(grossCents, 550)).toBe(1_833_333n);
    expect(calculateContribution(grossCents, 433)).toBe(1_443_333n);
    expect(calculateContribution(grossCents, 100)).toBe(333_333n);
  });

  // SDD: REQ-002 AC-002.4
  it('computes SEM, IVM and LPT as zero for a gross salary of 0.00', () => {
    const grossCents = 0n;
    expect(calculateContribution(grossCents, 550)).toBe(0n);
    expect(calculateContribution(grossCents, 433)).toBe(0n);
    expect(calculateContribution(grossCents, 100)).toBe(0n);
  });
});

describe('calculateIncomeTax — monthly income tax with 2026 progressive brackets (REQ-003)', () => {
  // SDD: REQ-003 AC-003.1
  it('is zero for a gross salary below the exempt threshold', () => {
    expect(calculateIncomeTax(50_000_000n, BRACKETS_2026)).toBe(0n);
  });

  // SDD: REQ-003 AC-003.2
  it('is zero for a gross salary exactly equal to the exempt threshold', () => {
    expect(calculateIncomeTax(91_800_000n, BRACKETS_2026)).toBe(0n);
  });

  // SDD: REQ-003 AC-003.3
  it('applies the second bracket marginally for a gross salary of 1,000,000.00', () => {
    expect(calculateIncomeTax(100_000_000n, BRACKETS_2026)).toBe(820_000n);
  });

  // SDD: REQ-003 AC-003.4
  it('applies brackets marginally for a gross salary of 2,000,000.00', () => {
    expect(calculateIncomeTax(200_000_000n, BRACKETS_2026)).toBe(14_085_000n);
  });

  // SDD: REQ-003 AC-003.5
  it('applies all five brackets marginally for a gross salary of 5,000,000.00', () => {
    expect(calculateIncomeTax(500_000_000n, BRACKETS_2026)).toBe(73_630_000n);
  });

  // SDD: REQ-003 AC-003.6
  it('taxes only the full lower brackets when the gross salary equals a bracket upper limit exactly', () => {
    expect(calculateIncomeTax(134_700_000n, BRACKETS_2026)).toBe(4_290_000n);
    expect(calculateIncomeTax(236_400_000n, BRACKETS_2026)).toBe(19_545_000n);
    expect(calculateIncomeTax(472_700_000n, BRACKETS_2026)).toBe(66_805_000n);
  });

  // SDD: REQ-003 AC-003.7
  it('rounds a tenth-of-a-cent tax down to zero just above the exempt threshold', () => {
    expect(calculateIncomeTax(91_800_001n, BRACKETS_2026)).toBe(0n);
  });
});

describe('calculateNetSalary — total deductions and net salary (REQ-004)', () => {
  // SDD: REQ-004 AC-004.1
  it('computes total deductions and net salary for a gross salary of 500,000.00', () => {
    const result = calculateNetSalary(50_000_000n, LEGAL_PARAMETERS_2026);
    expect(result.totalDeductionsCents).toBe(5_415_000n);
    expect(result.netCents).toBe(44_585_000n);
  });

  // SDD: REQ-004 AC-004.2
  it('computes total deductions and net salary for a gross salary of 1,000,000.00', () => {
    const result = calculateNetSalary(100_000_000n, LEGAL_PARAMETERS_2026);
    expect(result.totalDeductionsCents).toBe(11_650_000n);
    expect(result.netCents).toBe(88_350_000n);
  });

  // SDD: REQ-004 AC-004.3
  it('computes total deductions and net salary for a gross salary of 2,000,000.00', () => {
    const result = calculateNetSalary(200_000_000n, LEGAL_PARAMETERS_2026);
    expect(result.totalDeductionsCents).toBe(35_745_000n);
    expect(result.netCents).toBe(164_255_000n);
  });

  // SDD: REQ-004 AC-004.4
  it('computes total deductions and net salary for a gross salary of 5,000,000.00', () => {
    const result = calculateNetSalary(500_000_000n, LEGAL_PARAMETERS_2026);
    expect(result.totalDeductionsCents).toBe(127_780_000n);
    expect(result.netCents).toBe(372_220_000n);
  });

  // SDD: REQ-004 AC-004.5
  it('computes total deductions and net salary for a gross salary of 918,000.00', () => {
    const result = calculateNetSalary(91_800_000n, LEGAL_PARAMETERS_2026);
    expect(result.totalDeductionsCents).toBe(9_941_940n);
    expect(result.netCents).toBe(81_858_060n);
  });

  // SDD: REQ-004 AC-004.6
  it('computes total deductions and net salary as zero for a gross salary of 0.00', () => {
    const result = calculateNetSalary(0n, LEGAL_PARAMETERS_2026);
    expect(result.totalDeductionsCents).toBe(0n);
    expect(result.netCents).toBe(0n);
  });
});

describe('calculateNetSalary — net plus total deductions equals gross exactly (REQ-004 AC-004.7)', () => {
  // SDD: REQ-004 AC-004.7
  it('keeps net + totalDeductions === gross for fixed edge values and 1,000 generated values', () => {
    const bracketLimits = [91_800_000n, 134_700_000n, 236_400_000n, 472_700_000n];
    const edgeCases: Cents[] = [
      0n,
      1n,
      300n,
      91_800_001n,
      ...bracketLimits.flatMap((limit) => [limit - 1n, limit + 1n]),
      10n ** 17n, // 10^15 colones
    ];
    const generatedCases = generateCentsSample(1000, 42n);

    for (const grossCents of [...edgeCases, ...generatedCases]) {
      const result = calculateNetSalary(grossCents, LEGAL_PARAMETERS_2026);

      expect(result.netCents + result.totalDeductionsCents).toBe(grossCents);
      expect(result.semCents).toBeGreaterThanOrEqual(0n);
      expect(result.ivmCents).toBeGreaterThanOrEqual(0n);
      expect(result.lptCents).toBeGreaterThanOrEqual(0n);
      expect(result.incomeTaxCents).toBeGreaterThanOrEqual(0n);
      expect(result.netCents).toBeGreaterThanOrEqual(0n);
    }
  });
});

describe('calculateNetSalary — rounding half up before deriving totals (REQ-005)', () => {
  // SDD: REQ-005 AC-005.1
  it('rounds each deduction half up for a gross salary of 3.00', () => {
    const result = calculateNetSalary(300n, LEGAL_PARAMETERS_2026);
    expect(result.semCents).toBe(17n);
    expect(result.ivmCents).toBe(13n);
    expect(result.lptCents).toBe(3n);
    expect(result.totalDeductionsCents).toBe(33n);
    expect(result.netCents).toBe(267n);
  });

  // SDD: REQ-005 AC-005.2
  it('derives total deductions and net salary from rounded amounts for a gross salary of 333,333.33', () => {
    const result = calculateNetSalary(33_333_333n, LEGAL_PARAMETERS_2026);
    expect(result.totalDeductionsCents).toBe(3_609_999n);
    expect(result.netCents).toBe(29_723_334n);
  });
});

describe('calculateNetSalary / LEGAL_PARAMETERS_2026 — traceable legal parameters (NFR-002)', () => {
  // SDD: NFR-002 AC-N002.1
  it('uses the exact 2026 rates and brackets and reports legalYear 2026 through CURRENT_LEGAL_PARAMETERS', () => {
    expect(LEGAL_PARAMETERS_2026.year).toBe(2026);
    expect(LEGAL_PARAMETERS_2026.sem.basisPoints).toBe(550);
    expect(LEGAL_PARAMETERS_2026.ivm.basisPoints).toBe(433);
    expect(LEGAL_PARAMETERS_2026.lpt.basisPoints).toBe(100);
    expect(LEGAL_PARAMETERS_2026.incomeTax.brackets).toEqual(BRACKETS_2026);

    const result = calculateNetSalary(100_000_000n, CURRENT_LEGAL_PARAMETERS);

    expect(result.legalYear).toBe(2026);
    expect(result.semCents).toBe(5_500_000n);
    expect(result.ivmCents).toBe(4_330_000n);
    expect(result.lptCents).toBe(1_000_000n);
    expect(result.incomeTaxCents).toBe(820_000n);
    expect(result.totalDeductionsCents).toBe(11_650_000n);
    expect(result.netCents).toBe(88_350_000n);
  });

  // SDD: NFR-002 AC-N002.1
  it('changes the amounts and the legal year for a different set of legal parameters', () => {
    const fakeParams: LegalParameters = {
      year: 2099,
      sem: { basisPoints: 1000, source: 'fake-sem' },
      ivm: { basisPoints: 0, source: 'fake-ivm' },
      lpt: { basisPoints: 0, source: 'fake-lpt' },
      incomeTax: {
        source: 'fake-tax',
        brackets: [{ upperLimitCents: null, rateBasisPoints: 5000 }],
      },
    };

    const result = calculateNetSalary(100_000_000n, fakeParams);

    expect(result.legalYear).toBe(2099);
    expect(result.semCents).toBe(10_000_000n);
    expect(result.ivmCents).toBe(0n);
    expect(result.lptCents).toBe(0n);
    expect(result.incomeTaxCents).toBe(50_000_000n);
    expect(result.totalDeductionsCents).toBe(60_000_000n);
    expect(result.netCents).toBe(40_000_000n);
  });
});
