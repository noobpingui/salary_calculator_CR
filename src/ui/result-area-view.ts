import { CURRENT_LEGAL_PARAMETERS } from '../domain/legal-parameters';
import type { LegalParameters } from '../domain/legal-parameters';
import type { NetSalaryView } from './net-salary-view';
import { presentNetSalary } from './net-salary-view';

/** Empty-state hint (spec section 6, REQ-005). */
export const EMPTY_STATE_HINT = 'Ingrese su salario bruto mensual para ver el desglose.';

/** `live` = the field changed while typing; `submit` = Enter or "Calcular". */
export type EvaluationMode = 'live' | 'submit';

export type ResultAreaView = NetSalaryView | { readonly kind: 'empty'; readonly hint: string };

export type ResultAreaKind = ResultAreaView['kind'];

export type BreakdownLineRole = 'gross' | 'deduction' | 'total' | 'net';

export function presentResultArea(
  rawInput: string,
  mode: EvaluationMode,
  params: LegalParameters = CURRENT_LEGAL_PARAMETERS,
): ResultAreaView {
  if (mode === 'live' && rawInput.trim() === '') {
    return { kind: 'empty', hint: EMPTY_STATE_HINT };
  }
  return presentNetSalary(rawInput, params);
}

export function breakdownLineRole(index: number, lineCount: number): BreakdownLineRole {
  if (index < 0 || index >= lineCount) {
    throw new RangeError(`index ${index} is out of range for ${lineCount} lines`);
  }
  if (index === 0) return 'gross';
  if (index === lineCount - 1) return 'net';
  if (index === lineCount - 2) return 'total';
  return 'deduction';
}

export function isFieldInvalid(view: ResultAreaView): boolean {
  return view.kind === 'error';
}

export function shouldRevealResult(previous: ResultAreaKind | null, next: ResultAreaKind): boolean {
  return previous !== next;
}
