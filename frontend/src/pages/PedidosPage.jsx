import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus, Inbox, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as pedidoService from '../services/pedidoService';
import * as empresaService from '../services/empresaService';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { fechaISO, formatoCorto } from '../utils/fechas';

export default function PedidosPage({ empresaFija }) {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const [pedidos, setPedidos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [listaPedidos, listaEmpresas] = await Promise.all([
        pedidoService.listarPedidos(),
        empresaService.listarEmpresas(),
      ]);
      setPedidos(listaPedidos);
      setEmpresas(listaEmpresas);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los pedidos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const nombreEmpresa = (id) =>
    empresas.find((e) => e.id === id)?.nombre || `Empresa #${id}`;

  const filtrados = pedidos
    .filter((p) => !empresaFija || p.empresa_id === empresaFija.id)
    .filter((p) => !desde || fechaISO(p.fecha) >= desde)
    .filter((p) => !hasta || fechaISO(p.fecha) <= hasta)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div className="space-y-6">
      {empresaFija ? (
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-stone-800">Pedidos diarios</h2>
          <Link to="/pedido">
            <Button>
              <Plus className="w-4 h-4" />
              Cargar pedido
            </Button>
          </Link>
        </div>
      ) : (
        <PageHeader
          icono={ClipboardList}
          titulo="Pedidos diarios"
          subtitulo={esAdmin ? 'Historial de pedidos por día.' : 'Historial de tus pedidos.'}
          acciones={
            <Link to="/pedido">
              <Button>
                <Plus className="w-4 h-4" />
                Cargar pedido
              </Button>
            </Link>
          }
        />
      )}

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-sm font-medium text-stone-600 shrink-0" htmlFor="filtro-desde">
            Desde
          </label>
          <input
            id="filtro-desde"
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 transition focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 sm:max-w-[180px]"
          />
          <label className="text-sm font-medium text-stone-600 shrink-0" htmlFor="filtro-hasta">
            Hasta
          </label>
          <input
            id="filtro-hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 transition focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 sm:max-w-[180px]"
          />
          <Button
            variante="fantasma"
            tamanio="sm"
            className="sm:ml-auto"
            onClick={() => {
              setDesde('');
              setHasta('');
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </Card>

      {error && <Alert tipo="error">{error}</Alert>}

      {cargando ? (
        <Spinner texto="Cargando pedidos..." />
      ) : (
        <Card titulo={`${filtrados.length} ${filtrados.length === 1 ? 'pedido' : 'pedidos'}`}>
          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-stone-400">
              <Inbox className="w-8 h-8" />
              <p className="text-sm">No hay pedidos para los filtros elegidos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -m-2 p-2">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-200">
                    <th className="py-2.5 pr-4 font-medium">Pedido</th>
                    <th className="py-2.5 pr-4 font-medium">Fecha</th>
                    {esAdmin && !empresaFija && <th className="py-2.5 pr-4 font-medium">Empresa</th>}
                    <th className="py-2.5 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p) => (
                    <tr key={p.id} className="border-b border-stone-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-stone-800">#{p.id}</td>
                      <td className="py-3 pr-4 text-stone-600 tabular-nums">
                        {formatoCorto(p.fecha)}
                      </td>
                      {esAdmin && !empresaFija && (
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center gap-1.5 text-stone-700">
                            <Building2 className="w-3.5 h-3.5 text-stone-400" />
                            {nombreEmpresa(p.empresa_id)}
                          </span>
                        </td>
                      )}
                      <td className="py-3 text-right">
                        <Link
                          to={`/pedidos/${p.id}`}
                          className="text-sm font-medium text-brand-700 hover:text-brand-800 transition"
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
