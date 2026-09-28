import { describe, expect, it } from 'vitest';

const existing001TestFiles = import.meta.glob(
  [
    '../unit/format-crc.test.ts',
    '../unit/gross-salary.test.ts',
    '../unit/money.test.ts',
    '../unit/net-salary-view.test.ts',
    '../unit/net-salary.test.ts',
    '../unit/privacy.test.ts',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

describe('regression — 001 tests stay intact after the redesign (REQ-002)', () => {
  // SDD: REQ-002 AC-002.3
  it('finds every 001 test file and none is empty', () => {
    const paths = Object.keys(existing001TestFiles);
    expect(paths).toHaveLength(6);
    for (const [path, content] of Object.entries(existing001TestFiles)) {
      expect(content.length, `${path} should not be empty`).toBeGreaterThan(0);
    }
  });

  // SDD: REQ-002 AC-002.3
  it('never skips, focuses or marks a 001 test as todo', () => {
    const forbidden = [
      /\.skip\s*\(/,
      /\.only\s*\(/,
      /\.todo\s*\(/,
      /\bxdescribe\s*\(/,
      /\bxit\s*\(/,
    ];
    for (const [path, content] of Object.entries(existing001TestFiles)) {
      for (const pattern of forbidden) {
        expect(content, `${path} should not match ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});
