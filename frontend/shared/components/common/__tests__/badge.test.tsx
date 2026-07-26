import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge', () => {
  it('renders with text content', () => {
    render(<Badge>New</Badge>);
    const badge = screen.getByText('New');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-slot', 'badge');
  });

  it('renders variant="secondary"', () => {
    render(<Badge variant="secondary">Draft</Badge>);
    const badge = screen.getByText('Draft');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/bg-secondary/);
  });

  it('renders variant="destructive"', () => {
    render(<Badge variant="destructive">Closed</Badge>);
    const badge = screen.getByText('Closed');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/bg-destructive/);
  });

  it('renders variant="outline"', () => {
    render(<Badge variant="outline">Open</Badge>);
    const badge = screen.getByText('Open');
    expect(badge).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Badge className="custom-badge">Custom</Badge>);
    const badge = screen.getByText('Custom');
    expect(badge.className).toMatch(/custom-badge/);
  });
});
