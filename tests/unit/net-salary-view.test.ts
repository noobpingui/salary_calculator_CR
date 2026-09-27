import { describe, expect, it } from 'vitest';
import type { LegalParameters } from '../../src/domain/legal-parameters';
import { formatCRC } from '../../src/shared/format-crc';
import { GROSS_SALARY_ERROR_MESSAGES, presentNetSalary } from '../../src/ui/net-salary-view';

describe('presentNetSalary — invalid gross salary (REQ-001)', () => {
  // SDD: REQ-001 AC-001.1
  it('returns the empty-value error message with no lines for an empty input', () => {
    expect(presentNetSalary('')).toEqual({
      kind: 'error',
      message: GROSS_SALARY_ERROR_MESSAGES.empty,
    });
  });

  // SDD: REQ-001 AC-001.2
  it('returns the not-a-number error message for a non-numeric input', () => {
    expect(presentNetSalary('abc')).toEqual({
      kind: 'error',
      message: GROSS_SALARY_ERROR_MESSAGES['not-a-number'],
    });
  });

  // SDD: REQ-001 AC-001.3
  it('returns the not-a-number error message for "Infinity" and "NaN"', () => {
    expect(presentNetSalary('Infinity')).toEqual({
      kind: 'error',
      message: GROSS_SALARY_ERROR_MESSAGES['not-a-number'],
    });
    expect(presentNetSalary('NaN')).toEqual({
      kind: 'error',
      message: GROSS_SALARY_ERROR_MESSAGES['not-a-number'],
    });
  });

  // SDD: REQ-001 AC-001.4
  it('returns the negative-value error message for a negative input', () => {
    expect(presentNetSalary('-1')).toEqual({
      kind: 'error',
      message: GROSS_SALARY_ERROR_MESSAGES.negative,
    });
  });

  // SDD: REQ-001 AC-001.5
  it('returns the too-many-decimals error message for an input with 3 decimal places', () => {
    expect(presentNetSalary('1000.123')).toEqual({
      kind: 'error',
      message: GROSS_SALARY_ERROR_MESSAGES['too-many-decimals'],
    });
  });

  // SDD: REQ-001 AC-001.6
  it('returns an error view with no lines when an invalid input follows a valid one (stateless)', () => {
    const validView = presentNetSalary('1000000');
    expect(validView.kind).toBe('result');

    const invalidView = presentNetSalary('abc');

    expect(invalidView).toEqual({
      kind: 'error',
      message: GROSS_SALARY_ERROR_MESSAGES['not-a-number'],
    });
  });
});

describe('presentNetSalary — result breakdown (REQ-006)', () => {
  // SDD: REQ-006 AC-006.1
  it('returns the 7 breakdown labels and formatted amounts in the exact spec order', () => {
    const view = presentNetSalary('1000000');
    if (view.kind !== 'result') throw new Error('expected a result view');

    expect(view.lines).toEqual([
      { label: 'Salario bruto', amount: formatCRC(1_000_000) },
      { label: 'CCSS — Seguro de Enfermedad y Maternidad (5,50 %)', amount: formatCRC(55_000) },
      { label: 'CCSS — Invalidez, Vejez y Muerte (4,33 %)', amount: formatCRC(43_300) },
      { label: 'Banco Popular — LPT (1,00 %)', amount: formatCRC(10_000) },
      { label: 'Impuesto sobre la renta', amount: formatCRC(8_200) },
      { label: 'Total de rebajas', amount: formatCRC(116_500) },
      { label: 'Salario neto', amount: formatCRC(883_500) },
    ]);
  });

  // SDD: REQ-006 AC-006.2
  it('formats the "Salario neto" amount using the existing es-CR colón formatter', () => {
    const view = presentNetSalary('1000000');
    if (view.kind !== 'result') throw new Error('expected a result view');

    const netLine = view.lines[view.lines.length - 1];
    expect(netLine?.label).toBe('Salario neto');
    expect(netLine?.amount).toContain('₡');
    expect(netLine?.amount).toMatch(/883\D500,00/);
  });

  // SDD: REQ-006 AC-006.3
  it('includes the legal year note "Parámetros legales vigentes: 2026"', () => {
    const view = presentNetSalary('1000000');
    if (view.kind !== 'result') throw new Error('expected a result view');

    expect(view.legalYearNote).toBe('Parámetros legales vigentes: 2026');
  });

  // SDD: REQ-006 AC-006.4
  it('never shows the placeholder text "(cálculo de rebajas pendiente)"', () => {
    const view = presentNetSalary('1000000');
    if (view.kind !== 'result') throw new Error('expected a result view');

    const allText = [
      ...view.lines.map((line) => `${line.label} ${line.amount}`),
      view.legalYearNote,
    ].join(' ');
    expect(allText).not.toContain('(cálculo de rebajas pendiente)');
  });
});

describe('presentNetSalary — traceable legal parameters (NFR-002)', () => {
  // SDD: NFR-002 AC-N002.1
  it('changes the rate labels and the legal-year note for a different set of legal parameters', () => {
    const fakeParams: LegalParameters = {
      year: 2099,
      sem: { basisPoints: 1000, source: 'fake-sem' },
      ivm: { basisPoints: 200, source: 'fake-ivm' },
      lpt: { basisPoints: 50, source: 'fake-lpt' },
      incomeTax: {
        source: 'fake-tax',
        brackets: [{ upperLimitCents: null, rateBasisPoints: 500 }],
      },
    };

    const view = presentNetSalary('1000000', fakeParams);
    if (view.kind !== 'result') throw new Error('expected a result view');

    expect(view.lines.map((line) => line.label)).toEqual([
      'Salario bruto',
      'CCSS — Seguro de Enfermedad y Maternidad (10,00 %)',
      'CCSS — Invalidez, Vejez y Muerte (2,00 %)',
      'Banco Popular — LPT (0,50 %)',
      'Impuesto sobre la renta',
      'Total de rebajas',
      'Salario neto',
    ]);
    expect(view.legalYearNote).toBe('Parámetros legales vigentes: 2099');
  });
});
