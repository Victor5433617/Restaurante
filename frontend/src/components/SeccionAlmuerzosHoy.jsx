import { useCallback, useEffect, useState } from 'react';
import { UtensilsCrossed, RefreshCw, Inbox } from 'lucide-react';
import * as pedidoService from '../services/pedidoService';
import * as funcionarioService from '../services/funcionarioService';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Alert from './ui/Alert';
import Spinner from './ui/Spinner';
import { hoyISO, fechaISO, formatoLargo } from '../utils/fechas';

export default function SeccionAlmuerzosHoy({ empresa }) {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(
    async (mostrarSpinner) => {
      if (mostrarSpinner) setCargando(true);
      try {
        const [todosPedidos, todosFuncionarios] = await Promise.all([
          pedidoService.listarPedidos(),
          funcionarioService.listarFuncionarios(),
        ]);
        const hoy = hoyISO();
        const pedidoHoy = todosPedidos.find(
          (p) => p.empresa_id === empresa.id && fechaISO(p.fecha) === hoy
        );
        const funcionariosEmpresa = todosFuncionarios.filter((f) => f.empresa_id === empresa.id);

        let detalles = [];
        if (pedidoHoy) {
          const detalle = await pedidoService.obtenerDetallePedido(pedidoHoy.id);
          detalles = detalle.detalles.filter((d) => (d.tipo_comida || 'almuerzo') === 'almuerzo');
        }

        const idsConDetalle = new Set(detalles.map((d) => d.funcionario_id));
        const combinadas = [
          ...detalles.map((d) => ({
            funcionario_id: d.funcionario_id,
            nombre_completo: d.nombre_completo,
            opcion_numero: d.opcion_numero,
            plato_nombre: d.plato_nombre,
            observacion: d.observacion,
          })),
          ...funcionariosEmpresa
            .filter((f) => !idsConDetalle.has(f.id))
            .map((f) => ({
              funcionario_id: f.id,
              nombre_completo: f.nombre_completo,
              opcion_numero: null,
              plato_nombre: null,
              observacion: null,
            })),
        ].sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));

        setFilas(combinadas);
        setError('');
      } catch (err) {
        if (mostrarSpinner) setError(err.response?.data?.error || 'No se pudieron cargar los pedidos.');
      } finally {
        if (mostrarSpinner) setCargando(false);
      }
    },
    [empresa.id]
  );

  useEffect(() => {
    cargar(true);
    const intervalo = setInterval(() => cargar(false), 10000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  const totalConPedido = filas.filter((f) => f.opcion_numero).length;

  return (
    <Card
      titulo="Almuerzos de Hoy"
      subtitulo={formatoLargo(hoyISO())}
      icono={UtensilsCrossed}
      acciones={
        <Button variante="secundario" tamanio="sm" onClick={() => cargar(true)} cargando={cargando}>
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      }
    >
      {error && (
        <Alert tipo="error" className="mb-4">
          {error}
        </Alert>
      )}

      {cargando ? (
        <Spinner texto="Cargando pedidos..." />
      ) : filas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-stone-400">
          <Inbox className="w-8 h-8" />
          <p className="text-sm">Esta empresa todavía no tiene funcionarios cargados.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-stone-500 mb-3">
            {totalConPedido} de {filas.length}{' '}
            {filas.length === 1 ? 'funcionario anotado' : 'funcionarios anotados'}
          </p>
          <div className="overflow-x-auto -m-2 p-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-200">
                  <th className="py-2.5 pr-4 font-medium">Funcionario</th>
                  <th className="py-2.5 pr-4 font-medium">Opción</th>
                  <th className="py-2.5 font-medium">Observación</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.funcionario_id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition">
                    <td className="py-2.5 pr-4 font-medium text-stone-800">{f.nombre_completo}</td>
                    <td className="py-2.5 pr-4 text-stone-600">
                      {f.opcion_numero ? (
                        `Opción ${f.opcion_numero} — ${f.plato_nombre}`
                      ) : (
                        <Badge color="rojo">Sin pedido</Badge>
                      )}
                    </td>
                    <td className="py-2.5 text-stone-500">{f.observacion || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
