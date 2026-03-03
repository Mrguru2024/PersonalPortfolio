import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../textarea';

describe('Textarea', () => {
  it('renders with placeholder', () => {
    render(<Textarea placeholder="Enter description" />);
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
  });

  it('displays value when controlled', () => {
    render(<Textarea value="hello" readOnly onChange={() => {}} />);
    expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
  });

  it('calls onChange when user types', async () => {
    const handleChange = jest.fn();
    render(<Textarea onChange={handleChange} />);
    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, 'a');
    expect(handleChange).toHaveBeenCalled();
  });

  it('can be disabled', () => {
    render(<Textarea disabled placeholder="Disabled" />);
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });
});
