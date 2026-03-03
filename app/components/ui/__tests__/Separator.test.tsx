import React from 'react';
import { render } from '@testing-library/react';
import { Separator } from '../separator';

describe('Separator', () => {
  it('renders by default', () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies horizontal orientation class by default', () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).toHaveClass('h-[1px]', 'w-full');
  });

  it('applies vertical orientation when specified', () => {
    const { container } = render(<Separator orientation="vertical" />);
    expect(container.firstChild).toHaveClass('h-full', 'w-[1px]');
  });

  it('applies custom className', () => {
    const { container } = render(<Separator className="my-4" />);
    expect(container.firstChild).toHaveClass('my-4');
  });
});
