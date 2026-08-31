import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('muestra el mensaje', () => {
    render(<EmptyState mensaje="No hay datos." />);
    expect(screen.getByText('No hay datos.')).toBeInTheDocument();
  });

  it('renderiza children como acciones', () => {
    render(
      <EmptyState mensaje="Sin resultados">
        <button>Crear</button>
      </EmptyState>
    );
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
  });
});
