import React from 'react';
import { render } from '@testing-library/react';
import { Separator } from '../separator';

describe('Separator', () => {
  it('renders by default', () => {
    const { container } = render(<Separator />);
    const separator = container.firstElementChild as HTMLElement;
    expect(separator).toBeInTheDocument();
  });

  it('applies horizontal orientation class by default', () => {
    const { container } = render(<Separator />);
    const separator = container.firstElementChild as HTMLElement;
    expect(separator).toHaveClass('h-[1px]', 'w-full');
  });

  it('applies vertical orientation when specified', () => {
    const { container } = render(<Separator orientation="vertical" />);
    const separator = container.firstElementChild as HTMLElement;
    expect(separator).toHaveClass('h-full', 'w-[1px]');
  });

  it('applies custom className', () => {
    const { container } = render(<Separator className="my-4" />);
    const separator = container.firstElementChild as HTMLElement;
    expect(separator).toHaveClass('my-4');
  });
});
