/** Money amount in integer cents (1 colón = 100n). */
export type Cents = bigint;

/** Divides a non-negative numerator by a positive divisor, rounding half up (away from zero). */
export function divideRoundHalfUp(_numerator: bigint, _divisor: bigint): bigint {
  throw new Error('not implemented');
}

/** Converts cents to a colón amount as `number`, only for display (formatCRC). */
export function centsToNumber(_cents: Cents): number {
  throw new Error('not implemented');
}
