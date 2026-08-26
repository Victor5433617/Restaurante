import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Inbox, Pencil, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as pedidoService from '../services/pedidoService';
import * as funcionarioService from '../services/funcionarioService';
import * as menuService from '../services/menuService';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { formatoLargo, fechaISO } from '../utils/fechas';

export default function PedidoDetallePage() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const puedeEditar = usuario?.rol === 'admin' || usuario?.rol === 'encargada';

  const [pedido, setPedido] = useState(null);
  const [filas, setFilas] = useState([]);
  const [menuDelDia, setMenuDelDia] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  const [modalFuncionario, setModalFuncionario] = useState(null);
  const [draftMenuId, setDraftMenuId] = useState('');
  const [draftObservacion, setDraftObservacion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  const cargar = useCallback(
    async (mostrarSpinner) => {
      if (mostrarSpinner) setCargando(true);
      try {
        const [detallePedido, todosFuncionarios, todoElMenu] = await Promise.all([
          pedidoService.obtenerDetallePedido(id),
          funcionarioService.listarFuncionarios(),
          menuService.listarMenu(),
        ]);
        setPedido(detallePedido);
        setMenuDelDia(
          todoElMenu.filter((m) => fechaISO(m.fecha) === fechaISO(detallePedido.fecha))
        );
        const funcionariosEmpresa = todosFuncionarios.filter(
          (f) => f.empresa_id === detallePedido.empresa_id
        );
        // los funcionarios activos cubren el "Sin pedido"; los detalles ya guardados
        // se muestran igual aunque el funcionario haya sido dado de baja después
        const idsConDetalle = new Set(detallePedido.detalles.map((det) => det.funcionario_id));
        const combinadas = [
          ...detallePedido.detalles.map((d) => ({
            funcionario_id: d.funcionario_id,
            nombre_completo: d.nombre_completo,
            menu_semanal_id: d.menu_semanal_id,
            opcion_numero: d.opcion_numero,
            plato_nombre: d.plato_nombre,
            observacion: d.observacion,
          })),
          ...funcionariosEmpresa
            .filter((f) => !idsConDetalle.has(f.id))
            .map((f) => ({
              funcionario_id: f.id,
              nombre_completo: f.nombre_completo,
              menu_semanal_id: null,
              opcion_numero: null,
              plato_nombre: null,
              observacion: null,
            })),
        ].sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
        setFilas(combinadas);
        setError('');
      } catch (err) {
        if (mostrarSpinner) setError(err.response?.data?.error || 'No se pudo cargar el pedido.');
      } finally {
        if (mostrarSpinner) setCargando(false);
      }
    },
    [id]
  );

  useEffect(() => {
    cargar(true);
    const intervalo = setInterval(() => cargar(false), 10000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  const abrirModal = (f) => {
    setModalFuncionario(f);
    setDraftMenuId(f.menu_semanal_id ? String(f.menu_semanal_id) : '');
    setDraftObservacion(f.observacion || '');
    setErrorModal('');
  };

  const cerrarModal = () => setModalFuncionario(null);

  const guardarSeleccion = async () => {
    if (!draftMenuId || !modalFuncionario || !pedido) return;
    setErrorModal('');
    setGuardando(true);
    try {
      await pedidoService.anotarFuncionario({
        empresa_id: pedido.empresa_id,
        funcionario_id: modalFuncionario.funcionario_id,
        menu_semanal_id: Number(draftMenuId),
        observacion: draftObservacion || '',
        fecha: fechaISO(pedido.fecha),
      });
      cerrarModal();
      cargar(false);
    } catch (err) {
      setErrorModal(err.response?.data?.error || 'No se pudo guardar la selección');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <Spinner texto="Cargando pedido..." className="py-24" />;
  }

  if (error) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <Link to="/pedidos" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 transition">
          <ArrowLeft className="w-4 h-4" />
          Volver a pedidos
        </Link>
        <Alert tipo="error">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
      <Link to="/pedidos" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 transition">
        <ArrowLeft className="w-4 h-4" />
        Volver a pedidos
      </Link>

      <PageHeader
        icono={ClipboardList}
        titulo={`Pedido #${pedido.id}`}
        subtitulo={formatoLargo(pedido.fecha)}
      />

      <Card
        titulo={`${pedido.detalles.length} de ${filas.length} ${filas.length === 1 ? 'funcionario anotado' : 'funcionarios anotados'}`}
      >
        {filas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-stone-400">
            <Inbox className="w-8 h-8" />
            <p className="text-sm">Esta empresa todavía no tiene funcionarios cargados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -m-2 p-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-200">
                  <th className="py-2.5 pr-4 font-medium">Funcionario</th>
                  <th className="py-2.5 pr-4 font-medium">Opción</th>
                  <th className="py-2.5 pr-4 font-medium">Observación</th>
                  {puedeEditar && <th className="py-2.5 font-medium text-right">Acción</th>}
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.funcionario_id} className="border-b border-stone-100 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-stone-800">{f.nombre_completo}</td>
                    <td className="py-2.5 pr-4 text-stone-600">
                      {f.opcion_numero ? (
                        `Opción ${f.opcion_numero} — ${f.plato_nombre}`
                      ) : (
                        <Badge color="rojo">Sin pedido</Badge>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-stone-500">{f.observacion || '—'}</td>
                    {puedeEditar && (
                      <td className="py-2.5 text-right">
                        {!f.opcion_numero && (
                          <Button variante="fantasma" tamanio="sm" onClick={() => abrirModal(f)}>
                            <Pencil className="w-3.5 h-3.5" />
                            Elegir menú
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modalFuncionario && (
        <div className="fixed inset-0 z-50 bg-espresso-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900">{modalFuncionario.nombre_completo}</h2>
              <button
                onClick={cerrarModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {menuDelDia.length === 0 ? (
              <Alert tipo="aviso">No se cargó el menú de ese día.</Alert>
            ) : (
              <div className="space-y-2">
                {menuDelDia.map((m) => {
                  const elegida = String(draftMenuId) === String(m.id);
                  return (
                    <label
                      key={m.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                        elegida
                          ? 'border-brand-300 bg-brand-50/40 ring-1 ring-brand-100'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="opcion-menu"
                        className="mt-1"
                        checked={elegida}
                        onChange={() => setDraftMenuId(String(m.id))}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge color="brand">Opción {m.opcion_numero}</Badge>
                        </div>
                        <p className="text-sm font-medium text-stone-800">{m.plato_nombre}</p>
                        {m.descripcion && (
                          <p className="text-xs text-stone-500 leading-snug">{m.descripcion}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <Input
              label="Observación (opcional)"
              placeholder="Ej: sin arroz"
              value={draftObservacion}
              onChange={(e) => setDraftObservacion(e.target.value)}
            />

            {errorModal && <Alert tipo="error">{errorModal}</Alert>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <div className="flex gap-2">
                <Button variante="secundario" tamanio="sm" type="button" onClick={cerrarModal} disabled={guardando}>
                  Cancelar
                </Button>
                <Button
                  tamanio="sm"
                  type="button"
                  disabled={!draftMenuId || guardando}
                  cargando={guardando}
                  onClick={guardarSeleccion}
                >
                  Guardar selección
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
