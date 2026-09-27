import type { GrossSalaryError } from '../domain/gross-salary';
import type { LegalParameters } from '../domain/legal-parameters';

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
  | { readonly kind: 'result'; readonly lines: readonly BreakdownLine[]; readonly legalYearNote: string };

export function presentNetSalary(_rawInput: string, _params?: LegalParameters): NetSalaryView {
  throw new Error('not implemented');
}
