import { afterEach, describe, expect, it, vi } from 'vitest';
import { CURRENT_LEGAL_PARAMETERS } from '../../src/domain/legal-parameters';
import { calculateNetSalary } from '../../src/domain/net-salary';
import { presentNetSalary } from '../../src/ui/net-salary-view';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('privacy — no network calls or storage while calculating (NFR-001)', () => {
  // SDD: NFR-001 AC-N001.1
  it('never calls fetch, XMLHttpRequest, WebSocket, sendBeacon, storage APIs or the cookie setter', () => {
    const fetchFake = vi.fn();
    const xmlHttpRequestFake = vi.fn();
    const webSocketFake = vi.fn();
    const sendBeaconFake = vi.fn();
    const localStorageFake = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    const sessionStorageFake = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    const indexedDBFake = { open: vi.fn() };
    const cookieSetterFake = vi.fn();

    vi.stubGlobal('fetch', fetchFake);
    vi.stubGlobal('XMLHttpRequest', xmlHttpRequestFake);
    vi.stubGlobal('WebSocket', webSocketFake);
    vi.stubGlobal('navigator', { sendBeacon: sendBeaconFake });
    vi.stubGlobal('localStorage', localStorageFake);
    vi.stubGlobal('sessionStorage', sessionStorageFake);
    vi.stubGlobal('indexedDB', indexedDBFake);
    vi.stubGlobal('document', {
      get cookie() {
        return '';
      },
      set cookie(value: string) {
        cookieSetterFake(value);
      },
    });

    presentNetSalary('1000000');
    calculateNetSalary(100_000_000n, CURRENT_LEGAL_PARAMETERS);

    expect(fetchFake).not.toHaveBeenCalled();
    expect(xmlHttpRequestFake).not.toHaveBeenCalled();
    expect(webSocketFake).not.toHaveBeenCalled();
    expect(sendBeaconFake).not.toHaveBeenCalled();
    expect(localStorageFake.setItem).not.toHaveBeenCalled();
    expect(localStorageFake.getItem).not.toHaveBeenCalled();
    expect(sessionStorageFake.setItem).not.toHaveBeenCalled();
    expect(sessionStorageFake.getItem).not.toHaveBeenCalled();
    expect(indexedDBFake.open).not.toHaveBeenCalled();
    expect(cookieSetterFake).not.toHaveBeenCalled();
  });
});

describe('privacy — no forbidden APIs or placeholder text in the source (NFR-001, REQ-001, REQ-006)', () => {
  const sourceFiles = import.meta.glob('../../src/**/*.ts', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  // SDD: NFR-001 AC-N001.1
  it('does not reference network or storage APIs anywhere under src/', () => {
    const forbiddenTerms = [
      'fetch(',
      'XMLHttpRequest',
      'WebSocket',
      'sendBeacon',
      'localStorage',
      'sessionStorage',
      'indexedDB',
      'document.cookie',
    ];

    for (const [path, content] of Object.entries(sourceFiles)) {
      for (const term of forbiddenTerms) {
        expect(content, `${path} should not contain "${term}"`).not.toContain(term);
      }
    }
  });

  // SDD: REQ-006 AC-006.4
  it('does not contain the placeholder text "(cálculo de rebajas pendiente)" in main.ts', () => {
    const mainEntry = Object.entries(sourceFiles).find(([path]) => path.endsWith('/main.ts'));
    expect(mainEntry, 'src/main.ts should be found by the glob').toBeDefined();
    expect(mainEntry?.[1]).not.toContain('(cálculo de rebajas pendiente)');
  });

  // SDD: REQ-001 AC-001.6
  it('renders results using replaceChildren in main.ts', () => {
    const mainEntry = Object.entries(sourceFiles).find(([path]) => path.endsWith('/main.ts'));
    expect(mainEntry, 'src/main.ts should be found by the glob').toBeDefined();
    expect(mainEntry?.[1]).toContain('replaceChildren');
  });
});
