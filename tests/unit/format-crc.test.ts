import { describe, expect, it } from 'vitest';
import { formatCRC } from '../../src/shared/format-crc';

describe('formatCRC', () => {
  it('formatea un monto en colones con dos decimales', () => {
    const formatted = formatCRC(1000000);

    expect(formatted).toContain('₡');
    expect(formatted).toMatch(/1\D000\D000,00/);
  });
});
