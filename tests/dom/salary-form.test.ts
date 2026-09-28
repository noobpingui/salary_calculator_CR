// @vitest-environment jsdom
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GROSS_SALARY_ERROR_MESSAGES } from '../../src/ui/net-salary-view';
import { EMPTY_STATE_HINT } from '../../src/ui/result-area-view';

/** Mounts a fresh `#app` and re-imports the entry point, as `src/main.ts` wires listeners on load. */
async function renderApp(): Promise<{ user: ReturnType<typeof userEvent.setup> }> {
  document.body.innerHTML = '<div id="app"></div>';
  vi.resetModules();
  await import('../../src/main');
  return { user: userEvent.setup() };
}

function getGrossSalaryInput(): HTMLElement {
  return screen.getByRole('textbox', { name: 'Salario bruto mensual (CRC)' });
}

function getCalcularButton(): HTMLElement {
  return screen.getByRole('button', { name: 'Calcular' });
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('salary form — live recalculation while typing (REQ-003)', () => {
  // SDD: REQ-003 AC-003.1
  it('shows the matching breakdown while typing a valid value, without submitting', async () => {
    const { user } = await renderApp();
    const input = getGrossSalaryInput();

    await user.type(input, '1000000');

    const result = document.querySelector('#result');
    expect(result?.textContent).toContain('Salario neto');
    expect(result?.textContent).toContain('₡883 500,00');
  });

  // SDD: REQ-003 AC-003.2
  it('replaces the previous breakdown fully when the value changes, leaving no old amount', async () => {
    const { user } = await renderApp();
    const input = getGrossSalaryInput();

    await user.type(input, '500000');
    const result = document.querySelector('#result');
    expect(result?.textContent).toContain('₡500 000,00');

    await user.clear(input);
    await user.type(input, '1000000');

    expect(result?.textContent).not.toContain('₡500 000,00');
    expect(result?.textContent).toContain('₡1 000 000,00');
    expect(result?.textContent).toContain('₡883 500,00');
  });

  // SDD: REQ-003 AC-003.3
  it('shows the matching 001 error and no breakdown while typing a non-empty invalid value', async () => {
    const { user } = await renderApp();
    const input = getGrossSalaryInput();
    const result = document.querySelector('#result');

    const cases: Array<[string, string]> = [
      ['abc', GROSS_SALARY_ERROR_MESSAGES['not-a-number']],
      ['-1', GROSS_SALARY_ERROR_MESSAGES.negative],
      ['1000.123', GROSS_SALARY_ERROR_MESSAGES['too-many-decimals']],
    ];

    for (const [value, message] of cases) {
      await user.clear(input);
      await user.type(input, value);
      expect(result?.textContent, `value "${value}"`).toContain(message);
      expect(result?.textContent, `value "${value}"`).not.toContain('Salario neto');
    }
  });

  // SDD: REQ-003 AC-003.4
  it('returns to the empty state with no error when the field is cleared while typing', async () => {
    const { user } = await renderApp();
    const input = getGrossSalaryInput();
    const result = document.querySelector('#result');

    await user.type(input, '1000000');
    await user.clear(input);
    expect(result?.textContent).toContain(EMPTY_STATE_HINT);
    expect(screen.queryByRole('alert')).toBeNull();

    await user.type(input, 'abc');
    await user.clear(input);
    expect(result?.textContent).toContain(EMPTY_STATE_HINT);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('salary form — explicit submit (REQ-004)', () => {
  // SDD: REQ-004 AC-004.1
  it('shows the empty-value error and no breakdown when "Calcular" is activated with an empty field', async () => {
    const { user } = await renderApp();
    const button = getCalcularButton();
    const result = document.querySelector('#result');

    await user.click(button);

    expect(result?.textContent).toContain(GROSS_SALARY_ERROR_MESSAGES.empty);
    expect(result?.textContent).not.toContain('Salario neto');
  });

  // SDD: REQ-004 AC-004.2
  it('shows the breakdown for 2,000,000.00 after pressing Enter in the field', async () => {
    const { user } = await renderApp();
    const input = getGrossSalaryInput();
    const result = document.querySelector('#result');

    await user.type(input, '2000000{Enter}');

    expect(result?.textContent).toContain('₡1 642 550,00');
  });

  // SDD: REQ-004 AC-004.3
  it('moves focus to the field then the "Calcular" button when tabbing from page load', async () => {
    await renderApp();
    const input = getGrossSalaryInput();
    const button = getCalcularButton();
    const user = userEvent.setup();

    await user.tab();
    expect(document.activeElement).toBe(input);

    await user.tab();
    expect(document.activeElement).toBe(button);
  });
});

describe('salary form — empty state (REQ-005)', () => {
  // SDD: REQ-005 AC-005.1
  it('shows the empty-state hint and no error message on page load, before typing anything', async () => {
    await renderApp();
    const result = document.querySelector('#result');

    expect(result?.textContent).toContain(EMPTY_STATE_HINT);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('salary form — error presentation without color (REQ-007)', () => {
  // SDD: REQ-007 AC-007.1
  it('marks the field invalid for assistive technologies and exposes the message as an alert', async () => {
    const { user } = await renderApp();
    const input = getGrossSalaryInput();

    await user.type(input, 'abc');

    expect(input.getAttribute('aria-invalid')).toBe('true');
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe(GROSS_SALARY_ERROR_MESSAGES['not-a-number']);
  });

  // SDD: REQ-007 AC-007.2
  it('removes the invalid field state and the error message once the value becomes valid', async () => {
    const { user } = await renderApp();
    const input = getGrossSalaryInput();

    await user.type(input, 'abc');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    await user.clear(input);
    await user.type(input, '500000');

    expect(input.getAttribute('aria-invalid')).not.toBe('true');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  // SDD: REQ-007 AC-007.3
  it('exposes the error text exactly as the 001 message, with no added characters', async () => {
    const { user } = await renderApp();
    const input = getGrossSalaryInput();

    await user.type(input, '1000.123');

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe(GROSS_SALARY_ERROR_MESSAGES['too-many-decimals']);
  });
});
