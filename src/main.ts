import './style.css';
import type { NetSalaryView } from './ui/net-salary-view';
import { presentNetSalary } from './ui/net-salary-view';

const app = document.querySelector<HTMLDivElement>('#app');

/** Renders an error message or the breakdown lines into `container`, replacing its previous contents. */
function renderView(container: HTMLElement, view: NetSalaryView): void {
  if (view.kind === 'error') {
    const error = document.createElement('p');
    error.className = 'error';
    error.setAttribute('role', 'alert');
    error.textContent = view.message;
    container.replaceChildren(error);
    return;
  }

  const list = document.createElement('dl');
  list.className = 'breakdown';
  for (const line of view.lines) {
    const term = document.createElement('dt');
    term.textContent = line.label;
    const description = document.createElement('dd');
    description.textContent = line.amount;
    list.append(term, description);
  }

  const legalYear = document.createElement('p');
  legalYear.className = 'legal-year';
  legalYear.textContent = view.legalYearNote;

  container.replaceChildren(list, legalYear);
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

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!input || !result) return;
    const view = presentNetSalary(input.value);
    renderView(result, view);
  });
}
