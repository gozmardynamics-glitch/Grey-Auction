import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConditionReportPanel } from '../condition_report_panel';

describe('ConditionReportPanel (L4)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn((input: any) => {
      const url = String(input);
      if (url.endsWith('/history')) {
        return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: {
            id: 'r1',
            productId: 'p1',
            condition: 'used',
            grade: 'B',
            summary: 'Engine runs, minor panel dents',
            defects: [{ part: 'front bumper', severity: 'minor', description: 'paint scuff' }],
            createdAt: new Date().toISOString(),
          },
        }),
      });
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('renders the grade and summary from the latest report', async () => {
    render(<ConditionReportPanel productId="p1" />);
    expect(await screen.findByText('Grade B')).toBeInTheDocument();
    expect(screen.getByText('Engine runs, minor panel dents')).toBeInTheDocument();
    expect(screen.getByTestId('condition-grade')).toHaveTextContent('Grade B');
  });

  it('lists defects with their severity', async () => {
    render(<ConditionReportPanel productId="p1" />);
    expect(await screen.findByText(/front bumper/)).toBeInTheDocument();
    expect(screen.getByText(/\(minor\)/)).toBeInTheDocument();
  });

  it('shows a friendly empty state when there is no report', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    });
    render(<ConditionReportPanel productId="p1" />);
    expect(await screen.findByText(/No condition report on file/)).toBeInTheDocument();
  });

  it('returns nothing when no productId is supplied', () => {
    render(<ConditionReportPanel />);
    expect(screen.queryByTestId('condition-grade')).not.toBeInTheDocument();
  });
});
