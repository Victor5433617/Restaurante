import { useEffect, useState } from 'react';
import { Inbox } from 'lucide-react';
import * as menuService from '../services/menuService';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { fechaISO, formatoCorto } from '../utils/fechas';

export default function HistorialMenuSemanal() {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  useEffect(() => {
    menuService
      .listarMenu()
      .then(setHistorial)
      .catch(() => setError('No se pudo cargar el historial de menús.'))
      .finally(() => setCargando(false));
  }, []);

  const filtrado = historial
    .filter((m) => !desde || fechaISO(m.fecha) >= desde)
    .filter((m) => !hasta || fechaISO(m.fecha) <= hasta)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha) || a.opcion_numero - b.opcion_numero);

  if (cargando) {
    return <Spinner texto="Cargando historial..." className="py-16" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-sm font-medium text-stone-600 shrink-0" htmlFor="hist-desde">
            Desde
          </label>
          <input
            id="hist-desde"
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 transition focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 sm:max-w-[180px]"
          />
          <label className="text-sm font-medium text-stone-600 shrink-0" htmlFor="hist-hasta">
            Hasta
          </label>
          <input
            id="hist-hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 transition focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 sm:max-w-[180px]"
          />
          {(desde || hasta) && (
            <button
              type="button"
              onClick={() => {
                setDesde('');
                setHasta('');
              }}
              className="text-sm font-medium text-brand-700 hover:text-brand-800 transition sm:ml-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </Card>

      {error && <Alert tipo="error">{error}</Alert>}

      <Card titulo={`${filtrado.length} ${filtrado.length === 1 ? 'opción' : 'opciones'} registradas`}>
        {filtrado.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-stone-400">
            <Inbox className="w-8 h-8" />
            <p className="text-sm">No hay opciones de menú para el rango elegido.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -m-2 p-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-200">
                  <th className="py-2.5 pr-4 font-medium">Fecha</th>
                  <th className="py-2.5 pr-4 font-medium">Opción</th>
                  <th className="py-2.5 pr-4 font-medium">Plato</th>
                  <th className="py-2.5 font-medium">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {filtrado.map((m) => (
                  <tr key={m.id} className="border-b border-stone-100 last:border-0">
                    <td className="py-2.5 pr-4 text-stone-700 whitespace-nowrap tabular-nums">
                      {formatoCorto(m.fecha)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge color="brand">{m.opcion_numero}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-stone-800">{m.plato_nombre}</td>
                    <td className="py-2.5 text-stone-500">{m.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
