import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Alert from './Alert';

describe('Alert', () => {
  it('no renderiza si no tiene children', () => {
    const { container } = render(<Alert tipo="error" />);
    expect(container.firstChild).toBeNull();
  });

  it('muestra el mensaje de error con role alert', () => {
    render(<Alert tipo="error">Hubo un problema</Alert>);
    expect(screen.getByText('Hubo un problema')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('usa role status para avisos e info', () => {
    render(<Alert tipo="info">Dato informativo</Alert>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
