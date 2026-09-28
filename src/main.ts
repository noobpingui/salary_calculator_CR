import './style.css';
import type { EvaluationMode, PayslipView, SlipRow } from './ui/result-area-view';
import { isFieldInvalid, presentResultArea, shouldPrintSlip } from './ui/result-area-view';

const ERROR_ELEMENT_ID = 'gross-salary-error';

const app = document.querySelector<HTMLDivElement>('#app');

function span(className: string, text = ''): HTMLSpanElement {
  const element = document.createElement('span');
  element.className = className;
  element.textContent = text;
  return element;
}

/** One slip row: label (with its muted rate), a decorative dotted leader, then the amount. */
function buildSlipRow(row: SlipRow): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = `row row--${row.role}`;

  const term = document.createElement('dt');
  term.textContent = row.label;
  if (row.rate !== undefined) {
    term.append(' ', span('rate', row.rate));
  }

  const leader = span('leader');
  leader.setAttribute('aria-hidden', 'true');

  const description = document.createElement('dd');
  description.append(leader, span('amount', row.amount));

  wrapper.append(term, description);
  return wrapper;
}

/** Builds the paper slip for one valid result, without inserting it. */
function buildSlip(view: PayslipView): HTMLElement {
  const slip = document.createElement('article');
  slip.className = 'slip';

  const header = document.createElement('h2');
  header.className = 'slip__header';
  header.textContent = view.header;

  const subLine = document.createElement('p');
  subLine.className = 'slip__sub';
  subLine.textContent = view.subLine;

  const rows = document.createElement('dl');
  rows.className = 'slip__rows';
  rows.append(...view.rows.map(buildSlipRow));

  const footer = document.createElement('p');
  footer.className = 'slip__foot';
  footer.textContent = view.footer;

  slip.append(header, subLine, rows, footer);
  return slip;
}

if (app) {
  app.innerHTML = `
    <main class="desk">
      <div class="ask">
        <h1>¿Cuánto le queda de su salario?</h1>
        <p class="lead">Escriba su salario bruto mensual y le imprimimos la colilla con cada rebaja de ley.</p>
        <form id="salary-form" novalidate>
          <label for="gross-salary">Salario bruto mensual</label>
          <div class="field">
            <span class="field__prefix" aria-hidden="true">₡</span>
            <input id="gross-salary" name="gross-salary" type="text" inputmode="decimal" autocomplete="off" />
          </div>
          <div class="error-line"></div>
          <button type="submit" class="calc">Calcular</button>
        </form>
      </div>
      <section id="result" class="slot" aria-live="polite"></section>
    </main>
  `;

  const form = app.querySelector<HTMLFormElement>('#salary-form');
  const input = app.querySelector<HTMLInputElement>('#gross-salary');
  const field = app.querySelector<HTMLElement>('.field');
  const errorLine = app.querySelector<HTMLElement>('.error-line');
  const result = app.querySelector<HTMLElement>('#result');

  /** Amounts of the slip on screen, or `null` when no slip is shown. */
  let shownSlipKey: string | null = null;

  /** Evaluates the current field value in `mode` and renders the field state and the result column. */
  function evaluate(mode: EvaluationMode): void {
    if (!input || !field || !errorLine || !result) return;

    const view = presentResultArea(input.value, mode);

    const invalid = isFieldInvalid(view);
    field.classList.toggle('field--invalid', invalid);
    if (view.kind === 'error') {
      const error = document.createElement('p');
      error.id = ERROR_ELEMENT_ID;
      error.className = 'error';
      error.setAttribute('role', 'alert');
      error.textContent = view.message;
      errorLine.replaceChildren(error);
    } else {
      errorLine.replaceChildren();
    }
    if (invalid) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', ERROR_ELEMENT_ID);
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }

    result.dataset.state = view.kind;

    if (view.kind !== 'result') {
      shownSlipKey = null;
      if (view.kind === 'empty') {
        const hint = document.createElement('p');
        hint.className = 'hint';
        hint.textContent = view.hint;
        result.replaceChildren(hint);
      } else {
        result.replaceChildren();
      }
      return;
    }

    if (!shouldPrintSlip(shownSlipKey, view.amountsKey, mode)) return;

    const slip = buildSlip(view);
    slip.classList.add('print');
    result.replaceChildren(slip);
    shownSlipKey = view.amountsKey;
  }

  evaluate('live');

  input?.addEventListener('input', () => evaluate('live'));

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    evaluate('submit');
  });
}
