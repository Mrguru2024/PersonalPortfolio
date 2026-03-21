import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge', () => {
  it('renders with children', () => {
    render(<Badge>Label</Badge>);
    expect(screen.getByText('Label')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstElementChild).toHaveClass('bg-primary');
  });

  it('applies destructive variant', () => {
    const { container } = render(<Badge variant="destructive">Error</Badge>);
    expect(container.firstElementChild).toHaveClass('bg-destructive');
  });

  it('applies outline variant', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    expect(container.firstElementChild).toHaveClass('text-foreground');
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-badge">Badge</Badge>);
    expect(container.firstElementChild).toHaveClass('custom-badge');
  });
});
