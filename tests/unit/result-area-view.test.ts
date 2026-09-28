import { afterEach, describe, expect, it, vi } from 'vitest';
import { LEGAL_PARAMETERS_2026 } from '../../src/domain/legal-parameters';
import type { LegalParameters } from '../../src/domain/legal-parameters';
import { formatCRC } from '../../src/shared/format-crc';
import { GROSS_SALARY_ERROR_MESSAGES } from '../../src/ui/net-salary-view';
import {
  EMPTY_STATE_HINT,
  formatDeductionsShare,
  isFieldInvalid,
  presentResultArea,
  shouldPrintSlip,
} from '../../src/ui/result-area-view';
import type { PayslipView, ResultAreaView } from '../../src/ui/result-area-view';

/** Separator-agnostic comparison: the colón format may group with U+00A0 or U+0020 (spec section 4). */
function normalizeSpaces(text: string): string {
  return text.replaceAll(' ', ' ').replaceAll(' ', ' ');
}

function slipFor(input: string, params?: LegalParameters): PayslipView {
  const view: ResultAreaView = presentResultArea(input, 'submit', params);
  if (view.kind !== 'result') throw new Error(`expected a slip for "${input}", got ${view.kind}`);
  return view;
}

const MINUS = '−';

describe('presentResultArea — amounts and messages of 001 (REQ-002)', () => {
  // SDD: REQ-002 AC-002.1
  it('carries the 001 amounts in order for a gross salary of 1000000', () => {
    const amounts = slipFor('1000000').rows.map((row) => row.amount.replace(MINUS, ''));
    expect(amounts).toEqual(
      [1_000_000, 55_000, 43_300, 10_000, 8_200, 116_500, 883_500].map((n) => formatCRC(n)),
    );
  });

  // SDD: REQ-002 AC-002.2
  it('reproduces the 001 error messages on submit', () => {
    expect(presentResultArea('', 'submit')).toEqual({
      kind: 'error',
      message: GROSS_SALARY_ERROR_MESSAGES.empty,
    });
    expect(presentResultArea('abc', 'submit')).toEqual({
      kind: 'error',
      message: GROSS_SALARY_ERROR_MESSAGES['not-a-number'],
    });
    expect(presentResultArea('-1', 'submit')).toEqual({
      kind: 'error',
      message: GROSS_SALARY_ERROR_MESSAGES.negative,
    });
    expect(presentResultArea('1000.123', 'submit')).toEqual({
      kind: 'error',
      message: GROSS_SALARY_ERROR_MESSAGES['too-many-decimals'],
    });
  });
});

describe('presentResultArea — live and submit agree on non-empty input (REQ-003)', () => {
  // SDD: REQ-003 AC-003.5
  it('returns the same slip or error for the same non-empty input in both modes', () => {
    for (const input of ['1000000', 'abc', '-1', '1000.123']) {
      expect(presentResultArea(input, 'live')).toEqual(presentResultArea(input, 'submit'));
    }
  });
});

describe('presentResultArea — empty state (REQ-005)', () => {
  // SDD: REQ-005 AC-005.2
  it('returns the empty state with the exact hint for an empty or whitespace-only live value', () => {
    expect(presentResultArea('', 'live')).toEqual({ kind: 'empty', hint: EMPTY_STATE_HINT });
    expect(presentResultArea('   ', 'live')).toEqual({ kind: 'empty', hint: EMPTY_STATE_HINT });
    expect(EMPTY_STATE_HINT).toBe('Ingrese su salario bruto mensual para ver el desglose.');
  });

  // SDD: REQ-005 AC-005.3
  it('returns the empty-value error for an empty or whitespace-only submission', () => {
    for (const input of ['', '   ']) {
      expect(presentResultArea(input, 'submit')).toEqual({
        kind: 'error',
        message: GROSS_SALARY_ERROR_MESSAGES.empty,
      });
    }
  });
});

describe('presentResultArea — slip content (REQ-006, REQ-011)', () => {
  // SDD: REQ-006 AC-006.2
  it('has seven rows in the order gross, four deductions, total, net', () => {
    expect(slipFor('1000000').rows.map((row) => row.role)).toEqual([
      'gross',
      'deduction',
      'deduction',
      'deduction',
      'deduction',
      'total',
      'net',
    ]);
  });

  // SDD: REQ-011 AC-011.1
  it('has the header, sub-line, short labels and muted rates of the mockup', () => {
    const slip = slipFor('1000000');
    expect(slip.header).toBe('COLILLA DE PAGO');
    expect(slip.subLine).toBe('Estimación mensual · parámetros 2026');
    expect(slip.rows.map((row) => [row.label, row.rate && normalizeSpaces(row.rate)])).toEqual([
      ['Salario bruto', undefined],
      ['CCSS SEM', '5,50 %'],
      ['CCSS IVM', '4,33 %'],
      ['Banco Popular', '1,00 %'],
      ['Impuesto renta', undefined],
      ['Total rebajas', undefined],
      ['SALARIO NETO', undefined],
    ]);
  });

  // SDD: REQ-011 AC-011.2
  it('writes deductions and the total with a leading U+2212 and gross and net without a sign', () => {
    const rows = slipFor('1000000').rows;
    expect(rows[1]?.amount).toBe(`${MINUS}${formatCRC(55_000)}`);
    for (const row of rows) {
      const signed = row.role === 'deduction' || row.role === 'total';
      expect(row.amount.startsWith(MINUS), row.label).toBe(signed);
      expect(row.amount).not.toMatch(/^[+-]/);
    }
  });

  // SDD: REQ-011 AC-011.3
  it('takes the year and rates from the legal parameters', () => {
    const fixture: LegalParameters = {
      ...LEGAL_PARAMETERS_2026,
      year: 2031,
      sem: { ...LEGAL_PARAMETERS_2026.sem, basisPoints: 600 },
    };
    const slip = slipFor('1000000', fixture);
    expect(slip.subLine).toBe('Estimación mensual · parámetros 2031');
    expect(normalizeSpaces(slip.rows[1]?.rate ?? '')).toBe('6,00 %');
  });

  // SDD: REQ-011 AC-011.6
  it('writes the footer as the deductions share', () => {
    expect(normalizeSpaces(slipFor('1500000').footer)).toBe('15,2 % se va en rebajas');
  });
});

describe('formatDeductionsShare (REQ-012)', () => {
  // SDD: REQ-012 AC-012.1
  it('gives the share of the sample salaries', () => {
    const shares = ['1500000', '1000000', '2000000', '500000'].map((input) =>
      normalizeSpaces(slipFor(input).footer.replace(' se va en rebajas', '')),
    );
    expect(shares).toEqual(['15,2 %', '11,7 %', '17,9 %', '10,8 %']);
  });

  // SDD: REQ-012 AC-012.2
  it('rounds an exact half up', () => {
    expect(normalizeSpaces(formatDeductionsShare(11_650_000n, 100_000_000n))).toBe('11,7 %');
  });

  // SDD: REQ-012 AC-012.3
  it('is 0,0 % for a gross of 0', () => {
    expect(normalizeSpaces(formatDeductionsShare(0n, 0n))).toBe('0,0 %');
    expect(normalizeSpaces(slipFor('0').footer)).toBe('0,0 % se va en rebajas');
  });

  // SDD: REQ-012 AC-012.4
  it('keeps one decimal on a whole number', () => {
    expect(normalizeSpaces(formatDeductionsShare(10_000n, 100_000n))).toBe('10,0 %');
  });
});

describe('shouldPrintSlip (REQ-013)', () => {
  // SDD: REQ-013 AC-013.1 AC-013.2 AC-013.3
  it('prints a new or changed slip, skips unchanged amounts while typing and always prints on submit', () => {
    const a = slipFor('1000000').amountsKey;
    const same = slipFor('1000000.0').amountsKey;
    const b = slipFor('1500000').amountsKey;

    expect(same).toBe(a);
    expect(shouldPrintSlip(null, a, 'live')).toBe(true);
    expect(shouldPrintSlip(a, same, 'live')).toBe(false);
    expect(shouldPrintSlip(a, b, 'live')).toBe(true);
    expect(shouldPrintSlip(a, a, 'submit')).toBe(true);
  });
});

describe('isFieldInvalid (REQ-007)', () => {
  // SDD: REQ-007
  it('is true only for the error view', () => {
    expect(isFieldInvalid(presentResultArea('abc', 'submit'))).toBe(true);
    expect(isFieldInvalid(presentResultArea('1000000', 'submit'))).toBe(false);
    expect(isFieldInvalid(presentResultArea('', 'live'))).toBe(false);
  });
});

describe('privacy — no network calls or storage while producing a result-area view (NFR-001)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // SDD: NFR-001 AC-N001.1
  it('never calls fetch, XMLHttpRequest, WebSocket, sendBeacon or storage APIs', () => {
    const fakes = {
      fetch: vi.fn(),
      XMLHttpRequest: vi.fn(),
      WebSocket: vi.fn(),
      sendBeacon: vi.fn(),
      setItem: vi.fn(),
      getItem: vi.fn(),
      open: vi.fn(),
    };
    const storage = { getItem: fakes.getItem, setItem: fakes.setItem };
    vi.stubGlobal('fetch', fakes.fetch);
    vi.stubGlobal('XMLHttpRequest', fakes.XMLHttpRequest);
    vi.stubGlobal('WebSocket', fakes.WebSocket);
    vi.stubGlobal('navigator', { sendBeacon: fakes.sendBeacon });
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('sessionStorage', storage);
    vi.stubGlobal('indexedDB', { open: fakes.open });

    presentResultArea('1000000', 'live');
    presentResultArea('', 'submit');

    for (const [name, fake] of Object.entries(fakes)) {
      expect(fake, name).not.toHaveBeenCalled();
    }
  });
});
