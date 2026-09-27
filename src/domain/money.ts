/** Money amount in integer cents (1 colón = 100n). */
export type Cents = bigint;

/** Divides a non-negative numerator by a positive divisor, rounding half up (away from zero). */
export function divideRoundHalfUp(numerator: bigint, divisor: bigint): bigint {
  return (2n * numerator + divisor) / (2n * divisor);
}

/** Converts cents to a colón amount as `number`, only for display (formatCRC). */
export function centsToNumber(cents: Cents): number {
  return Number(cents) / 100;
}
