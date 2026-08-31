import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

describe('Button', () => {
  it('renderiza el texto del children', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('es visible pero deshabilitado mientras carga', () => {
    render(<Button cargando>Enviar</Button>);
    const boton = screen.getByRole('button', { name: 'Enviar' });
    expect(boton).toBeDisabled();
  });

  it('respeta disabled prop', () => {
    render(<Button disabled>Bloqueado</Button>);
    expect(screen.getByRole('button', { name: 'Bloqueado' })).toBeDisabled();
  });

  it('llama onClick al hacer click', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Clic</Button>);
    await user.click(screen.getByRole('button', { name: 'Clic' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('aplica la variante por defecto primario', () => {
    render(<Button>Aceptar</Button>);
    expect(screen.getByRole('button', { name: 'Aceptar' }).className).toContain('bg-brand-600');
  });
});
