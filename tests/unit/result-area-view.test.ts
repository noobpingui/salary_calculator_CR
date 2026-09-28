import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatCRC } from '../../src/shared/format-crc';
import { GROSS_SALARY_ERROR_MESSAGES } from '../../src/ui/net-salary-view';
import {
  breakdownLineRole,
  isFieldInvalid,
  presentResultArea,
  shouldRevealResult,
} from '../../src/ui/result-area-view';
import type { ResultAreaKind } from '../../src/ui/result-area-view';

describe('presentResultArea — same content as 001 (REQ-002)', () => {
  // SDD: REQ-002 AC-002.1
  it('reproduces the 001 breakdown, labels, order and legal-year note for a valid gross salary', () => {
    const expected = {
      kind: 'result',
      lines: [
        { label: 'Salario bruto', amount: formatCRC(1_000_000) },
        { label: 'CCSS — Seguro de Enfermedad y Maternidad (5,50 %)', amount: formatCRC(55_000) },
        { label: 'CCSS — Invalidez, Vejez y Muerte (4,33 %)', amount: formatCRC(43_300) },
        { label: 'Banco Popular — LPT (1,00 %)', amount: formatCRC(10_000) },
        { label: 'Impuesto sobre la renta', amount: formatCRC(8_200) },
        { label: 'Total de rebajas', amount: formatCRC(116_500) },
        { label: 'Salario neto', amount: formatCRC(883_500) },
      ],
      legalYearNote: 'Parámetros legales vigentes: 2026',
    };

    expect(presentResultArea('1000000', 'live')).toEqual(expected);
    expect(presentResultArea('1000000', 'submit')).toEqual(expected);
  });

  // SDD: REQ-002 AC-002.2
  it('reproduces the 001 error messages for empty, non-numeric, negative and over-precision inputs', () => {
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
  it('returns the same breakdown or error for the same non-empty input in both modes', () => {
    expect(presentResultArea('1000000', 'live')).toEqual(presentResultArea('1000000', 'submit'));
    expect(presentResultArea('abc', 'live')).toEqual(presentResultArea('abc', 'submit'));
    expect(presentResultArea('-1', 'live')).toEqual(presentResultArea('-1', 'submit'));
    expect(presentResultArea('1000.123', 'live')).toEqual(presentResultArea('1000.123', 'submit'));
  });
});

describe('presentResultArea — empty state while typing (REQ-005)', () => {
  // SDD: REQ-005 AC-005.2
  it('returns the empty state for an empty or whitespace-only input evaluated live', () => {
    expect(presentResultArea('', 'live')).toEqual({ kind: 'empty', hint: expect.any(String) });
    expect(presentResultArea('   ', 'live')).toEqual({ kind: 'empty', hint: expect.any(String) });
  });

  // SDD: REQ-005 AC-005.3
  it('returns the 001 empty-value error for an empty or whitespace-only input evaluated as submit', () => {
    expect(presentResultArea('', 'submit')).toEqual({
      kind: 'error',
      message: GROSS_SALARY_ERROR_MESSAGES.empty,
    });
    expect(presentResultArea('   ', 'submit')).toEqual({
      kind: 'error',
      message: GROSS_SALARY_ERROR_MESSAGES.empty,
    });
  });
});

describe('presentResultArea — breakdown shape (REQ-006)', () => {
  // SDD: REQ-006 AC-006.2
  it('returns exactly seven breakdown lines with "Salario neto" last and no added sign or prefix', () => {
    const view = presentResultArea('1000000', 'submit');
    if (view.kind !== 'result') throw new Error('expected a result view');

    expect(view.lines).toHaveLength(7);
    expect(view.lines[6]?.label).toBe('Salario neto');
    for (const line of view.lines) {
      expect(line.amount).toMatch(/^₡/);
      expect(line.amount).not.toMatch(/^[+-]/);
    }
  });
});

describe('breakdownLineRole (REQ-006)', () => {
  // SDD: REQ-006
  it('maps the first, last, second-to-last and a middle index to gross, net, total and deduction', () => {
    expect(breakdownLineRole(0, 7)).toBe('gross');
    expect(breakdownLineRole(6, 7)).toBe('net');
    expect(breakdownLineRole(5, 7)).toBe('total');
    expect(breakdownLineRole(2, 7)).toBe('deduction');
  });
});

describe('isFieldInvalid (REQ-007)', () => {
  // SDD: REQ-007
  it('returns true only when the view kind is "error"', () => {
    const errorView = presentResultArea('abc', 'submit');
    const resultView = presentResultArea('1000000', 'submit');
    const emptyView = presentResultArea('', 'live');

    expect(isFieldInvalid(errorView)).toBe(true);
    expect(isFieldInvalid(resultView)).toBe(false);
    expect(isFieldInvalid(emptyView)).toBe(false);
  });
});

describe('shouldRevealResult (REQ-008)', () => {
  // SDD: REQ-008
  it('returns true only when the result-area kind changes, and stays false across repeated result updates', () => {
    expect(shouldRevealResult(null, 'empty')).toBe(true);
    expect(shouldRevealResult('empty' as ResultAreaKind, 'empty' as ResultAreaKind)).toBe(false);
    expect(shouldRevealResult('empty' as ResultAreaKind, 'error' as ResultAreaKind)).toBe(true);
    expect(shouldRevealResult('error' as ResultAreaKind, 'result' as ResultAreaKind)).toBe(true);
    expect(shouldRevealResult('result' as ResultAreaKind, 'result' as ResultAreaKind)).toBe(false);
  });
});

describe('privacy — no network calls or storage while producing a result-area view (NFR-001)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // SDD: NFR-001 AC-N001.1
  it('never calls fetch, XMLHttpRequest, WebSocket, sendBeacon, storage APIs or the cookie setter', () => {
    const fetchFake = vi.fn();
    const xmlHttpRequestFake = vi.fn();
    const webSocketFake = vi.fn();
    const sendBeaconFake = vi.fn();
    const localStorageFake = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    const sessionStorageFake = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    const indexedDBFake = { open: vi.fn() };
    const cookieSetterFake = vi.fn();

    vi.stubGlobal('fetch', fetchFake);
    vi.stubGlobal('XMLHttpRequest', xmlHttpRequestFake);
    vi.stubGlobal('WebSocket', webSocketFake);
    vi.stubGlobal('navigator', { sendBeacon: sendBeaconFake });
    vi.stubGlobal('localStorage', localStorageFake);
    vi.stubGlobal('sessionStorage', sessionStorageFake);
    vi.stubGlobal('indexedDB', indexedDBFake);
    vi.stubGlobal('document', {
      get cookie() {
        return '';
      },
      set cookie(value: string) {
        cookieSetterFake(value);
      },
    });

    presentResultArea('1000000', 'live');
    presentResultArea('', 'submit');

    expect(fetchFake).not.toHaveBeenCalled();
    expect(xmlHttpRequestFake).not.toHaveBeenCalled();
    expect(webSocketFake).not.toHaveBeenCalled();
    expect(sendBeaconFake).not.toHaveBeenCalled();
    expect(localStorageFake.setItem).not.toHaveBeenCalled();
    expect(localStorageFake.getItem).not.toHaveBeenCalled();
    expect(sessionStorageFake.setItem).not.toHaveBeenCalled();
    expect(sessionStorageFake.getItem).not.toHaveBeenCalled();
    expect(indexedDBFake.open).not.toHaveBeenCalled();
    expect(cookieSetterFake).not.toHaveBeenCalled();
  });
});
