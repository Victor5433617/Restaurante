import { useEffect, useState } from 'react';
import { ClipboardList, Printer } from 'lucide-react';
import * as pedidoService from '../services/pedidoService';
import Card from './ui/Card';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import Alert from './ui/Alert';
import EmptyState from './ui/EmptyState';

export default function ReporteConsumoDiario({ empresa }) {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    pedidoService
      .listarPedidos()
      .then((todos) => {
        if (!vigente) return;
        const propios = todos
          .filter((p) => p.empresa_id === empresa.id)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        setPedidos(propios);
      })
      .catch((err) => {
        if (vigente) setError(err.response?.data?.error || 'No se pudieron cargar los pedidos.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [empresa.id]);

  return (
    <Card
      titulo="Historial de Pedidos"
      icono={ClipboardList}
      acciones={
        <Button variante="secundario" tamanio="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          Imprimir
        </Button>
      }
    >
      {error && <Alert tipo="error" className="mb-4">{error}</Alert>}
      {cargando ? (
        <Spinner texto="Cargando pedidos..." />
      ) : pedidos.length === 0 ? (
        <EmptyState mensaje="Todavía no hay pedidos registrados." />
      ) : (
        <div className="overflow-x-auto -m-2 p-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-200">
                <th className="py-2.5 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition">
                  <td className="py-2.5 text-stone-700">{p.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-stone-400 mt-4">
        El reporte PDF con desglose por fecha está disponible en la sección de Reportes.
      </p>
    </Card>
  );
}
