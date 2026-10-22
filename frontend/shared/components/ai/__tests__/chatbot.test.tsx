import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIChatbot from '../chatbot';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      launcherLabel: 'Open AI assistant',
      title: 'AI Assistant',
      inputPlaceholder: 'Ask me anything...',
      inputLabel: 'Message',
      greeting: 'Hello! I am the Grey Auctions assistant.',
      error: 'Sorry, I encountered an error. Please try again.',
      notConfigured: 'The AI assistant is not configured yet. Please try again later.',
      signInRequired: 'Please sign in to chat with the AI assistant.',
      send: 'Send',
      close: 'Close assistant',
    };
    return translations[key] ?? key;
  },
}));

// The chatbot reads the backend JWT from Redux to call the guarded AI endpoint.
vi.mock('@/redux/store', () => ({
  useAppSelector: (selector: (state: any) => unknown) =>
    selector({ auth: { token: 'test-token' } }),
}));

describe('AIChatbot', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { output: 'Here is a helpful reply.' } }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('opens the panel when the launcher is clicked', async () => {
    const user = userEvent.setup();
    render(<AIChatbot />);

    await user.click(screen.getByRole('button', { name: /open ai assistant/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: /ai assistant/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask me anything...')).toBeInTheDocument();
  });

  it('posts to the authenticated /ai/execute endpoint and renders the reply', async () => {
    const user = userEvent.setup();
    render(<AIChatbot />);
    await user.click(screen.getByRole('button', { name: /open ai assistant/i }));

    const input = screen.getByPlaceholderText('Ask me anything...');
    await user.type(input, 'How do I bid?');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [url, opts] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/ai/execute');
    expect(url).not.toContain('/ai/public/execute');
    expect(opts.method).toBe('POST');
    expect(opts.headers.Authorization).toBe('Bearer test-token');
    const body = JSON.parse(opts.body);
    expect(body.featureKey).toBe('chatbot_assistant');

    await waitFor(() => expect(screen.getByText('Here is a helpful reply.')).toBeInTheDocument());
  });

  it('asks anonymous visitors to sign in rather than failing silently', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    } as unknown as Response);

    const user = userEvent.setup();
    render(<AIChatbot />);
    await user.click(screen.getByRole('button', { name: /open ai assistant/i }));

    await user.type(screen.getByPlaceholderText('Ask me anything...'), 'hi');
    await user.keyboard('{Enter}');

    await waitFor(() =>
      expect(
        screen.getByText('Please sign in to chat with the AI assistant.'),
      ).toBeInTheDocument(),
    );
  });

  it('shows the not-configured copy for the not-enabled error', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "AI feature 'chatbot_assistant' is not enabled",
    } as unknown as Response);

    const user = userEvent.setup();
    render(<AIChatbot />);
    await user.click(screen.getByRole('button', { name: /open ai assistant/i }));

    await user.type(screen.getByPlaceholderText('Ask me anything...'), 'hi');
    await user.keyboard('{Enter}');

    await waitFor(() =>
      expect(screen.getByText('The AI assistant is not configured yet. Please try again later.')).toBeInTheDocument(),
    );
  });

  it('shows generic error copy for other failures', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    } as unknown as Response);

    const user = userEvent.setup();
    render(<AIChatbot />);
    await user.click(screen.getByRole('button', { name: /open ai assistant/i }));

    await user.type(screen.getByPlaceholderText('Ask me anything...'), 'hi');
    await user.keyboard('{Enter}');

    await waitFor(() =>
      expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument(),
    );
  });
});
