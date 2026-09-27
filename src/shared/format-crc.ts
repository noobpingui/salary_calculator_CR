const crcFormatter = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea un monto en colones costarricenses (CRC). */
export function formatCRC(amount: number): string {
  return crcFormatter.format(amount);
}
