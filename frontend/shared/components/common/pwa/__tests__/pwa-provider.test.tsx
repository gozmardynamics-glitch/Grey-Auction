import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PwaProvider, SERVICE_WORKER_URL } from '../pwa-provider';

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { value, configurable: true });
}

function mockServiceWorker(register: ReturnType<typeof vi.fn>) {
  Object.defineProperty(window.navigator, 'serviceWorker', {
    value: { register, ready: Promise.resolve({}) },
    configurable: true,
  });
}

describe('PwaProvider (L1)', () => {
  beforeEach(() => {
    setOnline(true);
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('renders children untouched', () => {
    render(
      <PwaProvider>
        <p>app content</p>
      </PwaProvider>,
    );
    expect(screen.getByText('app content')).toBeInTheDocument();
  });

  it('does not register a service worker outside production', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    const register = vi.fn().mockResolvedValue({});
    mockServiceWorker(register);
    render(<PwaProvider><p>x</p></PwaProvider>);
    await new Promise((r) => setTimeout(r, 10));
    expect(register).not.toHaveBeenCalled();
  });

  it('registers /sw.js with root scope in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const register = vi.fn().mockResolvedValue({});
    mockServiceWorker(register);
    render(<PwaProvider><p>x</p></PwaProvider>);
    await waitFor(() => expect(register).toHaveBeenCalledWith(SERVICE_WORKER_URL, { scope: '/' }));
  });

  it('shows the offline banner when the connection drops and hides it on reconnect', async () => {
    render(<PwaProvider><p>x</p></PwaProvider>);
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });
    await waitFor(() => expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument());
  });

  it('offers install when beforeinstallprompt fires and remembers dismissal', async () => {
    const user = userEvent.setup();
    const prompt = vi.fn().mockResolvedValue(undefined);
    const makeEvt = () => {
      const evt = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
        prompt: typeof prompt;
        userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
      };
      evt.prompt = prompt;
      evt.userChoice = Promise.resolve({ outcome: 'dismissed' as const });
      return evt;
    };

    render(<PwaProvider><p>x</p></PwaProvider>);
    act(() => {
      window.dispatchEvent(makeEvt());
    });

    expect(await screen.findByTestId('install-banner')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Dismiss install banner'));
    expect(screen.queryByTestId('install-banner')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('greyauction:install-dismissed')).toBe('1');

    // A second prompt stays hidden because the user dismissed it before.
    act(() => {
      window.dispatchEvent(makeEvt());
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByTestId('install-banner')).not.toBeInTheDocument();
  });
});
