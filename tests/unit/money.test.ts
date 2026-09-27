import { describe, expect, it } from 'vitest';
import { centsToNumber, divideRoundHalfUp } from '../../src/domain/money';

describe('divideRoundHalfUp', () => {
  // SDD: REQ-005 AC-005.1
  it('rounds an exact half cent up, away from zero', () => {
    expect(divideRoundHalfUp(165_000n, 10_000n)).toBe(17n);
  });

  // SDD: REQ-005
  it('rounds a value below half down', () => {
    expect(divideRoundHalfUp(164_999n, 10_000n)).toBe(16n);
  });

  // SDD: REQ-005
  it('returns the exact quotient for an even division, with no rounding needed', () => {
    expect(divideRoundHalfUp(20_000n, 10_000n)).toBe(2n);
  });
});

describe('centsToNumber', () => {
  // SDD: REQ-005
  it('converts a cents amount into the equivalent colón number for display', () => {
    expect(centsToNumber(88_350_000n)).toBe(883500);
  });

  // SDD: REQ-005
  it('converts a fractional cents amount into a decimal colón number', () => {
    expect(centsToNumber(17n)).toBe(0.17);
  });

  // SDD: REQ-005
  it('converts zero cents into zero', () => {
    expect(centsToNumber(0n)).toBe(0);
  });
});
