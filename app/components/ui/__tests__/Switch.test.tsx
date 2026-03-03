import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from '../switch';

describe('Switch', () => {
  it('renders and can be toggled', async () => {
    const handleCheckedChange = jest.fn();
    render(<Switch onCheckedChange={handleCheckedChange} />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toBeInTheDocument();
    await userEvent.click(switchEl);
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it('can be disabled', () => {
    render(<Switch disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('respects defaultChecked', () => {
    render(<Switch defaultChecked />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'checked');
  });
});
