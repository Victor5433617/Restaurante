import { useEffect, useState } from 'react';
import * as menuService from '../services/menuService';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
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
          <Input
            id="hist-desde"
            label="Desde"
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="sm:max-w-[180px]"
          />
          <Input
            id="hist-hasta"
            label="Hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="sm:max-w-[180px]"
          />
          {(desde || hasta) && (
            <Button
              variante="fantasma"
              tamanio="sm"
              onClick={() => {
                setDesde('');
                setHasta('');
              }}
              className="sm:ml-auto"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </Card>

      {error && <Alert tipo="error">{error}</Alert>}

      <Card titulo={`${filtrado.length} ${filtrado.length === 1 ? 'opción' : 'opciones'} registradas`}>
        {filtrado.length === 0 ? (
          <EmptyState mensaje="No hay opciones de menú para el rango elegido." />
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
                  <tr key={m.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition">
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
