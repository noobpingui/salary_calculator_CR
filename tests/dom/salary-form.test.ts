// @vitest-environment jsdom
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatCRC } from '../../src/shared/format-crc';
import { GROSS_SALARY_ERROR_MESSAGES } from '../../src/ui/net-salary-view';
import { EMPTY_STATE_HINT } from '../../src/ui/result-area-view';

const MINUS = '−';

/** Mounts a fresh `#app` and re-imports the entry point, as `src/main.ts` wires listeners on load. */
async function renderApp(): Promise<{ user: ReturnType<typeof userEvent.setup> }> {
  document.body.innerHTML = '<div id="app"></div>';
  vi.resetModules();
  await import('../../src/main');
  return { user: userEvent.setup() };
}

function getGrossSalaryInput(): HTMLInputElement {
  return screen.getByRole('textbox', { name: /^Salario bruto mensual/ });
}

function getCalcularButton(): HTMLElement {
  return screen.getByRole('button', { name: 'Calcular' });
}

function getResult(): HTMLElement {
  const result = document.querySelector<HTMLElement>('#result');
  if (!result) throw new Error('#result should exist');
  return result;
}

function getSlip(): HTMLElement | null {
  return getResult().querySelector<HTMLElement>('.slip');
}

/** Amounts shown in the slip, top to bottom. */
function slipAmounts(): string[] {
  return [...getResult().querySelectorAll('.amount')].map((element) => element.textContent ?? '');
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('salary form — amounts of 001 (REQ-002)', () => {
  // SDD: REQ-002 AC-002.4
  it('shows every amount exactly in the 001 colón format, only adding the leading minus sign', async () => {
    const { user } = await renderApp();
    await user.type(getGrossSalaryInput(), '1500000');

    expect(slipAmounts()).toEqual([
      formatCRC(1_500_000),
      `${MINUS}${formatCRC(82_500)}`,
      `${MINUS}${formatCRC(64_950)}`,
      `${MINUS}${formatCRC(15_000)}`,
      `${MINUS}${formatCRC(65_850)}`,
      `${MINUS}${formatCRC(228_300)}`,
      formatCRC(1_271_700),
    ]);
  });
});

describe('salary form — live recalculation while typing (REQ-003)', () => {
  // SDD: REQ-003 AC-003.1
  it('shows the slip while typing a valid value, without submitting', async () => {
    const { user } = await renderApp();
    await user.type(getGrossSalaryInput(), '1000000');

    expect(getSlip()).not.toBeNull();
    expect(slipAmounts().at(-1)).toBe(formatCRC(883_500));
  });

  // SDD: REQ-003 AC-003.2
  it('replaces the previous slip fully when the value changes', async () => {
    const { user } = await renderApp();
    const input = getGrossSalaryInput();

    await user.type(input, '500000');
    expect(slipAmounts()[0]).toBe(formatCRC(500_000));

    await user.clear(input);
    await user.type(input, '1000000');

    expect(slipAmounts()).not.toContain(formatCRC(500_000));
    expect(slipAmounts()[0]).toBe(formatCRC(1_000_000));
  });

  // SDD: REQ-003 AC-003.3
  it('shows the matching error and no slip while typing a non-empty invalid value', async () => {
    const { user } = await renderApp();
    const input = getGrossSalaryInput();

    const cases: Array<[string, string]> = [
      ['abc', GROSS_SALARY_ERROR_MESSAGES['not-a-number']],
      ['-1', GROSS_SALARY_ERROR_MESSAGES.negative],
      ['1000.123', GROSS_SALARY_ERROR_MESSAGES['too-many-decimals']],
    ];

    for (const [value, message] of cases) {
      await user.clear(input);
      await user.type(input, value);
      expect(screen.getByRole('alert').textContent, value).toBe(message);
      expect(getSlip(), value).toBeNull();
    }
  });

  // SDD: REQ-003 AC-003.4
  it('returns to the empty state with no error when the field is cleared', async () => {
    const { user } = await renderApp();
    const input = getGrossSalaryInput();

    await user.type(input, '1000000');
    await user.clear(input);
    expect(getResult().textContent).toBe(EMPTY_STATE_HINT);

    await user.type(input, 'abc');
    await user.clear(input);
    expect(getResult().textContent).toBe(EMPTY_STATE_HINT);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('salary form — explicit submit (REQ-004)', () => {
  // SDD: REQ-004 AC-004.1
  it('shows the empty-value error and no slip when "Calcular" is activated on an empty field', async () => {
    const { user } = await renderApp();
    await user.click(getCalcularButton());

    expect(screen.getByRole('alert').textContent).toBe(GROSS_SALARY_ERROR_MESSAGES.empty);
    expect(getSlip()).toBeNull();
  });

  // SDD: REQ-004 AC-004.2
  it('shows the slip for 2000000 after pressing Enter in the field', async () => {
    const { user } = await renderApp();
    await user.type(getGrossSalaryInput(), '2000000{Enter}');

    expect(slipAmounts().at(-1)).toBe(formatCRC(1_642_550));
  });

  // SDD: REQ-004 AC-004.3
  it('moves focus to the field then the "Calcular" button when tabbing from page load', async () => {
    const { user } = await renderApp();

    await user.tab();
    expect(document.activeElement).toBe(getGrossSalaryInput());
    await user.tab();
    expect(document.activeElement).toBe(getCalcularButton());
  });
});

describe('salary form — empty state (REQ-005)', () => {
  // SDD: REQ-005 AC-005.1
  it('starts with an empty field, the exact hint, no slip and no error', async () => {
    await renderApp();

    expect(getGrossSalaryInput().value).toBe('');
    expect(getResult().textContent).toBe(EMPTY_STATE_HINT);
    expect(getSlip()).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('salary form — slip structure (REQ-006, REQ-011)', () => {
  // SDD: REQ-006 AC-006.2 AC-006.3
  it('has seven rows with the net last, dashed rules after gross and before total, double rule above net', async () => {
    const { user } = await renderApp();
    await user.type(getGrossSalaryInput(), '1000000');

    const rows = [...getResult().querySelectorAll('.row')];
    expect(rows.map((row) => row.className)).toEqual([
      'row row--gross',
      'row row--deduction',
      'row row--deduction',
      'row row--deduction',
      'row row--deduction',
      'row row--total',
      'row row--net',
    ]);
    expect(rows.at(-1)?.querySelector('dt')?.textContent).toBe('SALARIO NETO');
  });

  // SDD: REQ-011 AC-011.4
  it('shows label, then a hidden leader with no text, then the amount on each row', async () => {
    const { user } = await renderApp();
    await user.type(getGrossSalaryInput(), '1500000');

    const rows = [...getResult().querySelectorAll('.row')];
    expect(rows).toHaveLength(7);
    for (const row of rows) {
      const term = row.querySelector('dt');
      const leader = row.querySelector('.leader');
      const amount = row.querySelector('.amount');
      expect(term && leader && amount).toBeTruthy();
      expect(term?.compareDocumentPosition(leader as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(leader?.compareDocumentPosition(amount as Node)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
      expect(leader?.getAttribute('aria-hidden')).toBe('true');
      expect(leader?.textContent).toBe('');
    }
  });

  // SDD: REQ-011 AC-011.6 ; REQ-010 AC-010.6
  it('ends with the deductions share footer, no privacy line and no "Pura Vida"', async () => {
    const { user } = await renderApp();
    await user.type(getGrossSalaryInput(), '1500000');

    const footer = getResult().querySelector('.slip__foot')?.textContent ?? '';
    expect(footer.replaceAll(' ', ' ')).toBe('15,2 % se va en rebajas');
    expect(document.body.textContent?.toLowerCase()).not.toContain('pura vida');
    expect(getResult().textContent?.toLowerCase()).not.toContain('privacidad');
  });
});

describe('salary form — accessible errors (REQ-007)', () => {
  // SDD: REQ-007 AC-007.1
  it('marks the field invalid, links it to the message and exposes the message as an alert', async () => {
    const { user } = await renderApp();
    const input = getGrossSalaryInput();
    await user.type(input, 'abc');

    const alert = screen.getByRole('alert');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(alert.id);
    expect(alert.textContent).toBe(GROSS_SALARY_ERROR_MESSAGES['not-a-number']);
  });

  // SDD: REQ-007 AC-007.2
  it('clears the invalid state and the message once the value becomes valid', async () => {
    const { user } = await renderApp();
    const input = getGrossSalaryInput();

    await user.type(input, 'abc');
    await user.clear(input);
    await user.type(input, '500000');

    expect(input.hasAttribute('aria-invalid')).toBe(false);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  // SDD: REQ-007 AC-007.3
  it('exposes the error text exactly as the 001 message', async () => {
    const { user } = await renderApp();
    await user.type(getGrossSalaryInput(), '1000.123');

    expect(screen.getByRole('alert').textContent).toBe(
      GROSS_SALARY_ERROR_MESSAGES['too-many-decimals'],
    );
  });

  // SDD: REQ-007 AC-007.4
  it('places the error after the field and before "Calcular", with no slip', async () => {
    const { user } = await renderApp();
    const input = getGrossSalaryInput();
    await user.type(input, '-1');

    const alert = screen.getByRole('alert');
    expect(input.compareDocumentPosition(alert)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(alert.compareDocumentPosition(getCalcularButton())).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(alert.closest('form')).not.toBeNull();
    expect(getSlip()).toBeNull();
  });
});

describe('salary form — print motion (REQ-013)', () => {
  // SDD: REQ-013 AC-013.1
  it('marks the slip to print when it first appears', async () => {
    const { user } = await renderApp();
    await user.type(getGrossSalaryInput(), '1500000');

    expect(getSlip()?.classList.contains('print')).toBe(true);
  });

  // SDD: REQ-013 AC-013.2
  it('does not reprint for the same amounts while typing, and reprints when they change', async () => {
    const { user } = await renderApp();
    const input = getGrossSalaryInput();

    await user.type(input, '1000000');
    const first = getSlip();
    await user.type(input, '.0');
    expect(getSlip()).toBe(first);

    await user.clear(input);
    await user.type(input, '1500000');
    const reprinted = getSlip();
    expect(reprinted).not.toBe(first);
    expect(reprinted?.classList.contains('print')).toBe(true);
  });

  // SDD: REQ-013 AC-013.3
  it('reprints on Enter or "Calcular" with the same value', async () => {
    const { user } = await renderApp();
    const input = getGrossSalaryInput();

    await user.type(input, '2000000');
    const typed = getSlip();
    await user.type(input, '{Enter}');
    const entered = getSlip();
    expect(entered).not.toBe(typed);

    await user.click(getCalcularButton());
    expect(getSlip()).not.toBe(entered);
    expect(getSlip()?.classList.contains('print')).toBe(true);
  });
});

describe('salary form — form column content (REQ-014)', () => {
  // SDD: REQ-014 AC-014.1
  it('has the headline, the copy line and the unchanged document title', async () => {
    document.title = 'Calculadora de Salario Neto - Costa Rica';
    await renderApp();

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('¿Cuánto le queda de su salario?');
    expect(heading.nextElementSibling?.textContent).toBe(
      'Escriba su salario bruto mensual y le imprimimos la colilla con cada rebaja de ley.',
    );
    expect(document.title).toBe('Calculadora de Salario Neto - Costa Rica');
  });

  // SDD: REQ-014 AC-014.2
  it('labels the field "Salario bruto mensual" and keeps the ₡ prefix out of the value and the tree', async () => {
    await renderApp();
    const input = getGrossSalaryInput();

    expect(document.querySelector('label[for="gross-salary"]')?.textContent).toBe(
      'Salario bruto mensual',
    );
    expect(input.value).toBe('');
    const prefix = document.querySelector('.field__prefix');
    expect(prefix?.textContent).toBe('₡');
    expect(prefix?.getAttribute('aria-hidden')).toBe('true');
  });

  // SDD: REQ-014 AC-014.3
  it('has exactly one field and one submit button labelled "Calcular"', async () => {
    await renderApp();
    const form = document.querySelector('form');

    expect(form?.querySelectorAll('input, select, textarea')).toHaveLength(1);
    const buttons = form?.querySelectorAll('button');
    expect(buttons).toHaveLength(1);
    expect(buttons?.[0]?.getAttribute('type')).toBe('submit');
    expect(buttons?.[0]?.textContent).toBe('Calcular');
  });
});

describe('salary form — accessibility (NFR-002)', () => {
  // SDD: NFR-002 AC-N002.4
  it('uses a polite live region for the result and hides decorative elements', async () => {
    const { user } = await renderApp();
    await user.type(getGrossSalaryInput(), '1500000');

    expect(getResult().getAttribute('aria-live')).toBe('polite');
    for (const leader of getResult().querySelectorAll('.leader')) {
      expect(leader.getAttribute('aria-hidden')).toBe('true');
    }
  });
});
