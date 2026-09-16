import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import * as empresaService from '../services/empresaService';
import Card from './ui/Card';
import Alert from './ui/Alert';

const COMIDAS = [
  { campo: 'habilita_desayuno', etiqueta: 'Habilitar desayuno' },
  { campo: 'habilita_almuerzo', etiqueta: 'Habilitar almuerzo' },
  { campo: 'habilita_merienda', etiqueta: 'Habilitar merienda' },
  { campo: 'habilita_cena', etiqueta: 'Habilitar cena' },
];

export default function ConfiguracionComidas({ empresa, onActualizado }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cambiar = async (campo, valor) => {
    setError('');
    setGuardando(true);
    try {
      const actualizada = await empresaService.actualizarComidas(empresa.id, {
        habilita_desayuno: empresa.habilita_desayuno,
        habilita_almuerzo: empresa.habilita_almuerzo,
        habilita_merienda: empresa.habilita_merienda,
        habilita_cena: empresa.habilita_cena,
        [campo]: valor,
      });
      onActualizado(actualizada);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar la configuración de comidas.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Card
      titulo="Comidas habilitadas"
      subtitulo="Elegí qué comidas provee el comedor a esta empresa."
      icono={UtensilsCrossed}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {COMIDAS.map((c) => (
          <label
            key={c.campo}
            className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer rounded-lg border border-stone-200 px-3 py-2.5 hover:border-brand-300 transition"
          >
            <input
              type="checkbox"
              checked={Boolean(empresa[c.campo])}
              disabled={guardando}
              onChange={(e) => cambiar(c.campo, e.target.checked)}
              className="accent-brand-600"
            />
            {c.etiqueta}
          </label>
        ))}
      </div>
      {error && <Alert tipo="error" className="mt-3">{error}</Alert>}
    </Card>
  );
}
