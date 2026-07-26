import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('CardHeader renders', () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('CardTitle renders', () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByRole('heading', { name: 'Title' });
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H3');
  });

  it('CardDescription renders', () => {
    render(<CardDescription>Description text</CardDescription>);
    const desc = screen.getByText('Description text');
    expect(desc).toBeInTheDocument();
    expect(desc.tagName).toBe('P');
  });

  it('CardContent renders', () => {
    render(<CardContent>Body content</CardContent>);
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('CardFooter renders', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('Card applies custom className', () => {
    render(<Card className="custom-card">Test</Card>);
    expect(screen.getByText('Test').className).toMatch(/custom-card/);
  });
});
