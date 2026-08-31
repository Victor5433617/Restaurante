import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Select from './Select';

const OPCIONES = [
  { valor: 'encargada', etiqueta: 'Encargada' },
  { valor: 'funcionario', etiqueta: 'Funcionario' },
];

describe('Select', () => {
  it('renderiza el label y las opciones', () => {
    render(<Select id="rol" label="Rol" value="" onChange={() => {}} opciones={OPCIONES} />);
    expect(screen.getByLabelText('Rol')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Encargada' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Funcionario' })).toBeInTheDocument();
  });

  it('muestra placeholder cuando está vacío', () => {
    render(<Select id="rol" value="" onChange={() => {}} opciones={OPCIONES} placeholder="Elegir..." />);
    expect(screen.getByRole('option', { name: 'Elegir...' })).toBeInTheDocument();
  });

  it('llama onChange al seleccionar', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Select id="rol" value="" onChange={onChange} opciones={OPCIONES} />);
    await user.selectOptions(screen.getByRole('combobox'), 'funcionario');
    expect(onChange).toHaveBeenCalled();
  });
});
