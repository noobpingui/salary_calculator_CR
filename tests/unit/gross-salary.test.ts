import { describe, expect, it } from 'vitest';
import { parseGrossSalary } from '../../src/domain/gross-salary';

describe('parseGrossSalary — invalid input', () => {
  // SDD: REQ-001 AC-001.1
  it('returns the empty error for an empty string', () => {
    expect(parseGrossSalary('')).toEqual({ ok: false, error: 'empty' });
  });

  // SDD: REQ-001 AC-001.1
  it('returns the empty error for a whitespace-only string', () => {
    expect(parseGrossSalary('   ')).toEqual({ ok: false, error: 'empty' });
  });

  // SDD: REQ-001 AC-001.2
  it('returns the not-a-number error for a non-numeric string', () => {
    expect(parseGrossSalary('abc')).toEqual({ ok: false, error: 'not-a-number' });
  });

  // SDD: REQ-001 AC-001.3
  it('returns the not-a-number error for the literal "Infinity"', () => {
    expect(parseGrossSalary('Infinity')).toEqual({ ok: false, error: 'not-a-number' });
  });

  // SDD: REQ-001 AC-001.3
  it('returns the not-a-number error for the literal "NaN"', () => {
    expect(parseGrossSalary('NaN')).toEqual({ ok: false, error: 'not-a-number' });
  });

  // SDD: REQ-001 AC-001.4
  it('returns the negative error for -1', () => {
    expect(parseGrossSalary('-1')).toEqual({ ok: false, error: 'negative' });
  });

  // SDD: REQ-001
  it('accepts -0 as zero rather than reporting it as negative', () => {
    expect(parseGrossSalary('-0')).toEqual({ ok: true, grossCents: 0n });
  });

  // SDD: REQ-001 AC-001.5
  it('returns the too-many-decimals error for a value with 3 decimal places', () => {
    expect(parseGrossSalary('1000.123')).toEqual({ ok: false, error: 'too-many-decimals' });
  });

  // SDD: REQ-001
  it('accepts a value with exactly 2 decimal places', () => {
    expect(parseGrossSalary('1000.10')).toEqual({ ok: true, grossCents: 100_010n });
  });
});

describe('parseGrossSalary — valid input', () => {
  // SDD: REQ-001 AC-001.7
  it('trims surrounding whitespace and parses the value into exact cents', () => {
    expect(parseGrossSalary('  500000  ')).toEqual({ ok: true, grossCents: 50_000_000n });
  });

  // SDD: REQ-001 AC-001.7
  it('parses zero into zero cents', () => {
    expect(parseGrossSalary('0')).toEqual({ ok: true, grossCents: 0n });
  });

  // SDD: REQ-001 AC-001.7
  it('parses a value with cents into exact cents', () => {
    expect(parseGrossSalary('333333.33')).toEqual({ ok: true, grossCents: 33_333_333n });
  });
});
