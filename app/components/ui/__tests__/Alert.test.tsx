import React from 'react';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from '../alert';

describe('Alert', () => {
  it('renders with role="alert"', () => {
    render(<Alert>Message</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Message');
  });

  it('renders full composition with title and description', () => {
    render(
      <Alert>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description text</AlertDescription>
      </Alert>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('applies destructive variant class', () => {
    const { container } = render(<Alert variant="destructive">Error</Alert>);
    // Destructive variant uses border-destructive/50 and text-destructive
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toMatch(/destructive/);
  });
});
