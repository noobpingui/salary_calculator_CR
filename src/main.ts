import './style.css';
import { formatCRC } from './shared/format-crc';

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  app.innerHTML = `
    <main>
      <h1>Calculadora de Salario Neto</h1>
      <form id="salary-form">
        <label for="gross-salary">Salario bruto mensual (CRC)</label>
        <input id="gross-salary" name="gross-salary" type="number" min="0" step="0.01" required />
        <button type="submit">Calcular</button>
      </form>
      <output id="result" for="gross-salary"></output>
    </main>
  `;

  const form = app.querySelector<HTMLFormElement>('#salary-form');
  const input = app.querySelector<HTMLInputElement>('#gross-salary');
  const result = app.querySelector<HTMLOutputElement>('#result');

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!input || !result) return;
    const gross = Number(input.value);
    // Placeholder del walking skeleton: el cálculo de rebajas se implementa en features posteriores.
    result.textContent = `Salario bruto ingresado: ${formatCRC(gross)} (cálculo de rebajas pendiente)`;
  });
}
