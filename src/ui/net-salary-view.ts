import { parseGrossSalary } from '../domain/gross-salary';
import type { GrossSalaryError } from '../domain/gross-salary';
import { CURRENT_LEGAL_PARAMETERS } from '../domain/legal-parameters';
import type { LegalParameters } from '../domain/legal-parameters';
import { centsToNumber } from '../domain/money';
import { calculateNetSalary } from '../domain/net-salary';
import { formatCRC } from '../shared/format-crc';

/** Spanish error messages shown instead of the breakdown (spec section 6). */
export const GROSS_SALARY_ERROR_MESSAGES: Readonly<Record<GrossSalaryError, string>> = {
  empty: 'Ingrese el salario bruto mensual.',
  'not-a-number': 'El salario bruto debe ser un número válido.',
  negative: 'El salario bruto no puede ser negativo.',
  'too-many-decimals': 'El salario bruto admite como máximo 2 decimales.',
};

export interface BreakdownLine {
  readonly label: string;
  /** Already formatted with formatCRC. */
  readonly amount: string;
}

export type NetSalaryView =
  | { readonly kind: 'error'; readonly message: string }
  | {
      readonly kind: 'result';
      readonly lines: readonly BreakdownLine[];
      readonly legalYearNote: string;
    };

const ratePercentFormatter = new Intl.NumberFormat('es-CR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats a basis-points rate as a percentage label, e.g. `550` -> `5,50 %`. */
function formatRate(basisPoints: number): string {
  return `${ratePercentFormatter.format(basisPoints / 100)} %`;
}

export function presentNetSalary(
  rawInput: string,
  params: LegalParameters = CURRENT_LEGAL_PARAMETERS,
): NetSalaryView {
  const parsed = parseGrossSalary(rawInput);
  if (!parsed.ok) {
    return { kind: 'error', message: GROSS_SALARY_ERROR_MESSAGES[parsed.error] };
  }

  const result = calculateNetSalary(parsed.grossCents, params);

  const lines: BreakdownLine[] = [
    { label: 'Salario bruto', amount: formatCRC(centsToNumber(result.grossCents)) },
    {
      label: `CCSS — Seguro de Enfermedad y Maternidad (${formatRate(params.sem.basisPoints)})`,
      amount: formatCRC(centsToNumber(result.semCents)),
    },
    {
      label: `CCSS — Invalidez, Vejez y Muerte (${formatRate(params.ivm.basisPoints)})`,
      amount: formatCRC(centsToNumber(result.ivmCents)),
    },
    {
      label: `Banco Popular — LPT (${formatRate(params.lpt.basisPoints)})`,
      amount: formatCRC(centsToNumber(result.lptCents)),
    },
    { label: 'Impuesto sobre la renta', amount: formatCRC(centsToNumber(result.incomeTaxCents)) },
    { label: 'Total de rebajas', amount: formatCRC(centsToNumber(result.totalDeductionsCents)) },
    { label: 'Salario neto', amount: formatCRC(centsToNumber(result.netCents)) },
  ];

  return {
    kind: 'result',
    lines,
    legalYearNote: `Parámetros legales vigentes: ${params.year}`,
  };
}
