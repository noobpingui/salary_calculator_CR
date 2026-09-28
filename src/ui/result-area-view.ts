import { parseGrossSalary } from '../domain/gross-salary';
import { CURRENT_LEGAL_PARAMETERS } from '../domain/legal-parameters';
import type { LegalParameters } from '../domain/legal-parameters';
import type { Cents } from '../domain/money';
import { centsToNumber, divideRoundHalfUp } from '../domain/money';
import { calculateNetSalary } from '../domain/net-salary';
import { formatCRC } from '../shared/format-crc';
import { GROSS_SALARY_ERROR_MESSAGES, formatRate } from './net-salary-view';

/** Empty-state hint (spec section 6, REQ-005). */
export const EMPTY_STATE_HINT = 'Ingrese su salario bruto mensual para ver el desglose.';

/** Slip header (spec section 6, REQ-011). */
export const SLIP_HEADER = 'COLILLA DE PAGO';

/** Minus sign written before deduction and total amounts (U+2212, AC-011.2). */
export const MINUS_SIGN = '−';

/** `live` = the field changed while typing; `submit` = Enter or "Calcular". */
export type EvaluationMode = 'live' | 'submit';

export type SlipRowRole = 'gross' | 'deduction' | 'total' | 'net';

export interface SlipRow {
  readonly role: SlipRowRole;
  readonly label: string;
  /** Muted rate shown after the label, e.g. `5,50 %`; only on the percentage deductions. */
  readonly rate?: string;
  /** 001 colón format, with a leading U+2212 on deductions and the total. */
  readonly amount: string;
}

export interface PayslipView {
  readonly kind: 'result';
  readonly header: string;
  readonly subLine: string;
  /** Seven rows: gross, four deductions, total, net (in this order). */
  readonly rows: readonly SlipRow[];
  readonly footer: string;
  /** Identifies the amounts shown, so an unchanged slip is not printed again while typing. */
  readonly amountsKey: string;
}

export type ResultAreaView =
  | { readonly kind: 'empty'; readonly hint: string }
  | { readonly kind: 'error'; readonly message: string }
  | PayslipView;

export type ResultAreaKind = ResultAreaView['kind'];

const shareFormatter = new Intl.NumberFormat('es-CR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Total deductions as a share of gross, rounded half up to one decimal: `15,2 %` (REQ-012). */
export function formatDeductionsShare(totalDeductionsCents: Cents, grossCents: Cents): string {
  const tenthsOfPercent =
    grossCents === 0n ? 0n : divideRoundHalfUp(totalDeductionsCents * 1000n, grossCents);
  return `${shareFormatter.format(Number(tenthsOfPercent) / 10)} %`;
}

function crc(cents: Cents): string {
  return formatCRC(centsToNumber(cents));
}

function negativeCrc(cents: Cents): string {
  return `${MINUS_SIGN}${crc(cents)}`;
}

export function presentResultArea(
  rawInput: string,
  mode: EvaluationMode,
  params: LegalParameters = CURRENT_LEGAL_PARAMETERS,
): ResultAreaView {
  if (mode === 'live' && rawInput.trim() === '') {
    return { kind: 'empty', hint: EMPTY_STATE_HINT };
  }

  const parsed = parseGrossSalary(rawInput);
  if (!parsed.ok) {
    return { kind: 'error', message: GROSS_SALARY_ERROR_MESSAGES[parsed.error] };
  }

  const result = calculateNetSalary(parsed.grossCents, params);

  const rows: SlipRow[] = [
    { role: 'gross', label: 'Salario bruto', amount: crc(result.grossCents) },
    {
      role: 'deduction',
      label: 'CCSS SEM',
      rate: formatRate(params.sem.basisPoints),
      amount: negativeCrc(result.semCents),
    },
    {
      role: 'deduction',
      label: 'CCSS IVM',
      rate: formatRate(params.ivm.basisPoints),
      amount: negativeCrc(result.ivmCents),
    },
    {
      role: 'deduction',
      label: 'Banco Popular',
      rate: formatRate(params.lpt.basisPoints),
      amount: negativeCrc(result.lptCents),
    },
    { role: 'deduction', label: 'Impuesto renta', amount: negativeCrc(result.incomeTaxCents) },
    { role: 'total', label: 'Total rebajas', amount: negativeCrc(result.totalDeductionsCents) },
    { role: 'net', label: 'SALARIO NETO', amount: crc(result.netCents) },
  ];

  return {
    kind: 'result',
    header: SLIP_HEADER,
    subLine: `Estimación mensual · parámetros ${params.year}`,
    rows,
    footer: `${formatDeductionsShare(result.totalDeductionsCents, result.grossCents)} se va en rebajas`,
    amountsKey: `${params.year}:${result.grossCents}`,
  };
}

export function isFieldInvalid(view: ResultAreaView): boolean {
  return view.kind === 'error';
}

/**
 * Whether a slip with `nextKey` should be (re)printed when `shownKey` is on screen (REQ-013):
 * always on submit, and while typing only when the amounts change.
 */
export function shouldPrintSlip(
  shownKey: string | null,
  nextKey: string,
  mode: EvaluationMode,
): boolean {
  return mode === 'submit' || shownKey !== nextKey;
}
