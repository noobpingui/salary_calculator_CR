import './style.css';
import type { EvaluationMode, ResultAreaKind, ResultAreaView } from './ui/result-area-view';
import {
  breakdownLineRole,
  isFieldInvalid,
  presentResultArea,
  shouldRevealResult,
} from './ui/result-area-view';

const ERROR_ELEMENT_ID = 'gross-salary-error';

/** Normalizes the non-breaking spaces `Intl.NumberFormat` uses as group separators to regular
 * spaces for on-screen text, since `dd` amounts already render with `white-space: nowrap`. */
function toDisplayText(amount: string): string {
  return amount.replaceAll(' ', ' ');
}

const app = document.querySelector<HTMLDivElement>('#app');

/** Builds the single content element for the result area for one `view`, without inserting it. */
function buildResultContent(view: ResultAreaView): HTMLElement {
  if (view.kind === 'empty') {
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = view.hint;
    return hint;
  }

  if (view.kind === 'error') {
    const error = document.createElement('p');
    error.id = ERROR_ELEMENT_ID;
    error.className = 'error';
    error.setAttribute('role', 'alert');
    error.textContent = view.message;
    return error;
  }

  const wrapper = document.createElement('div');

  const list = document.createElement('dl');
  list.className = 'breakdown';
  view.lines.forEach((line, index) => {
    const role = breakdownLineRole(index, view.lines.length);
    const lineWrapper = document.createElement('div');
    lineWrapper.className = `line line--${role}`;

    const term = document.createElement('dt');
    term.textContent = line.label;
    const description = document.createElement('dd');
    description.textContent = toDisplayText(line.amount);

    lineWrapper.append(term, description);
    list.append(lineWrapper);
  });

  const legalYear = document.createElement('p');
  legalYear.className = 'legal-year';
  legalYear.textContent = view.legalYearNote;

  wrapper.append(list, legalYear);
  return wrapper;
}

if (app) {
  app.innerHTML = `
    <main>
      <h1>Calculadora de Salario Neto</h1>
      <form id="salary-form">
        <label for="gross-salary">Salario bruto mensual (CRC)</label>
        <input id="gross-salary" name="gross-salary" type="text" inputmode="decimal" autocomplete="off" />
        <button type="submit">Calcular</button>
      </form>
      <section id="result" aria-live="polite"></section>
    </main>
  `;

  const form = app.querySelector<HTMLFormElement>('#salary-form');
  const input = app.querySelector<HTMLInputElement>('#gross-salary');
  const result = app.querySelector<HTMLElement>('#result');

  let previousKind: ResultAreaKind | null = null;

  /** Evaluates the current field value in `mode` and renders the matching result-area state. */
  function evaluate(mode: EvaluationMode): void {
    if (!input || !result) return;

    const view = presentResultArea(input.value, mode);
    const content = buildResultContent(view);

    if (shouldRevealResult(previousKind, view.kind)) {
      content.classList.add('reveal');
    }
    previousKind = view.kind;

    result.dataset.state = view.kind;
    result.replaceChildren(content);

    if (isFieldInvalid(view)) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', ERROR_ELEMENT_ID);
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  }

  evaluate('live');

  input?.addEventListener('input', () => evaluate('live'));

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    evaluate('submit');
  });
}
