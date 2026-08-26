import { useEffect, useState } from 'react';
import { ClipboardList, Printer, Inbox } from 'lucide-react';
import * as pedidoService from '../services/pedidoService';
import Card from './ui/Card';
import Button from './ui/Button';

export default function ReporteConsumoDiario({ empresa }) {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    pedidoService.listarPedidos().then((todos) => {
      const propios = todos
        .filter((p) => p.empresa_id === empresa.id)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setPedidos(propios);
      setCargando(false);
    });
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
      {cargando ? (
        <p className="text-stone-500 text-sm">Cargando...</p>
      ) : pedidos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-stone-400">
          <Inbox className="w-8 h-8" />
          <p className="text-sm">Todavía no hay pedidos registrados.</p>
        </div>
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
                <tr key={p.id} className="border-b border-stone-100 last:border-0">
                  <td className="py-2.5 text-stone-700">{p.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-stone-400 mt-4">
        El reporte PDF con desglose de funcionarios por fecha se implementa en la Fase 8.
      </p>
    </Card>
  );
}
