import { CURRENT_LEGAL_PARAMETERS } from '../domain/legal-parameters';
import type { LegalParameters } from '../domain/legal-parameters';
import type { NetSalaryView } from './net-salary-view';

/** Empty-state hint (spec section 6, REQ-005). */
export const EMPTY_STATE_HINT = 'Ingrese su salario bruto mensual para ver el desglose.';

/** `live` = the field changed while typing; `submit` = Enter or "Calcular". */
export type EvaluationMode = 'live' | 'submit';

export type ResultAreaView = NetSalaryView | { readonly kind: 'empty'; readonly hint: string };

export type ResultAreaKind = ResultAreaView['kind'];

export type BreakdownLineRole = 'gross' | 'deduction' | 'total' | 'net';

export function presentResultArea(
  _rawInput: string,
  _mode: EvaluationMode,
  _params: LegalParameters = CURRENT_LEGAL_PARAMETERS,
): ResultAreaView {
  throw new Error('not implemented');
}

export function breakdownLineRole(_index: number, _lineCount: number): BreakdownLineRole {
  throw new Error('not implemented');
}

export function isFieldInvalid(_view: ResultAreaView): boolean {
  throw new Error('not implemented');
}

export function shouldRevealResult(_previous: ResultAreaKind | null, _next: ResultAreaKind): boolean {
  throw new Error('not implemented');
}
