import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Pencil, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as pedidoService from '../services/pedidoService';
import * as funcionarioService from '../services/funcionarioService';
import * as menuService from '../services/menuService';
import * as empresaService from '../services/empresaService';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { formatoLargo, fechaISO } from '../utils/fechas';

const COMIDAS = [
  { tipo: 'desayuno', campo: 'habilita_desayuno', etiqueta: 'Desayuno' },
  { tipo: 'almuerzo', campo: 'habilita_almuerzo', etiqueta: 'Almuerzo' },
  { tipo: 'merienda', campo: 'habilita_merienda', etiqueta: 'Merienda' },
  { tipo: 'cena', campo: 'habilita_cena', etiqueta: 'Cena' },
];

export default function PedidoDetallePage() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const puedeEditar = usuario?.rol === 'admin' || usuario?.rol === 'encargada';

  const [pedido, setPedido] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [detallesPorTipo, setDetallesPorTipo] = useState({});
  const [funcionariosEmpresa, setFuncionariosEmpresa] = useState([]);
  const [tipoActivo, setTipoActivo] = useState('almuerzo');
  const [menuDelDia, setMenuDelDia] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [funcionarioMarcando, setFuncionarioMarcando] = useState(null);

  const [modalFuncionario, setModalFuncionario] = useState(null);
  const [draftMenuId, setDraftMenuId] = useState('');
  const [draftObservacion, setDraftObservacion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  const cargar = useCallback(
    async (mostrarSpinner) => {
      if (mostrarSpinner) setCargando(true);
      try {
        const [detallePedido, todosFuncionarios, todoElMenu, empresas] = await Promise.all([
          pedidoService.obtenerDetallePedido(id),
          funcionarioService.listarFuncionarios(),
          menuService.listarMenu(),
          empresaService.listarEmpresas(),
        ]);
        setPedido(detallePedido);
        setEmpresa(empresas.find((e) => e.id === detallePedido.empresa_id) || null);
        setMenuDelDia(
          todoElMenu.filter((m) => fechaISO(m.fecha) === fechaISO(detallePedido.fecha))
        );
        setFuncionariosEmpresa(
          todosFuncionarios.filter((f) => f.empresa_id === detallePedido.empresa_id)
        );

        const porTipo = {};
        for (const d of detallePedido.detalles) {
          const tipo = d.tipo_comida || 'almuerzo';
          if (!porTipo[tipo]) porTipo[tipo] = {};
          porTipo[tipo][d.funcionario_id] = d;
        }
        setDetallesPorTipo(porTipo);
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

  const comidasHabilitadas = COMIDAS.filter((c) => empresa?.[c.campo]);

  useEffect(() => {
    if (comidasHabilitadas.length === 0) return;
    if (!comidasHabilitadas.some((c) => c.tipo === tipoActivo)) {
      setTipoActivo(comidasHabilitadas[0].tipo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa]);

  const detallesTipo = detallesPorTipo[tipoActivo] || {};
  const idsConDetalle = new Set(Object.keys(detallesTipo).map(Number));
  const filas = [
    ...funcionariosEmpresa
      .filter((f) => idsConDetalle.has(f.id))
      .map((f) => ({ funcionario: f, detalle: detallesTipo[f.id] })),
    ...funcionariosEmpresa
      .filter((f) => !idsConDetalle.has(f.id))
      .map((f) => ({ funcionario: f, detalle: null })),
  ].sort((a, b) => a.funcionario.nombre_completo.localeCompare(b.funcionario.nombre_completo));

  const abrirModal = (f, detalle) => {
    setModalFuncionario(f);
    setDraftMenuId(detalle?.menu_semanal_id ? String(detalle.menu_semanal_id) : '');
    setDraftObservacion(detalle?.observacion || '');
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
        funcionario_id: modalFuncionario.id,
        menu_semanal_id: Number(draftMenuId),
        observacion: draftObservacion || '',
        tipo_comida: 'almuerzo',
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

  const alternarSimple = async (f, detalle) => {
    if (!pedido) return;
    setError('');
    setFuncionarioMarcando(f.id);
    try {
      if (detalle) {
        await pedidoService.quitarFuncionario({
          empresa_id: pedido.empresa_id,
          funcionario_id: f.id,
          tipo_comida: tipoActivo,
          fecha: fechaISO(pedido.fecha),
        });
      } else {
        await pedidoService.anotarFuncionario({
          empresa_id: pedido.empresa_id,
          funcionario_id: f.id,
          tipo_comida: tipoActivo,
          fecha: fechaISO(pedido.fecha),
        });
      }
      await cargar(false);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar la marca.');
    } finally {
      setFuncionarioMarcando(null);
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

  const totalAnotados = Object.keys(detallesTipo).length;

  return (
    <div className="space-y-6">
      <Link to="/pedidos" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 transition">
        <ArrowLeft className="w-4 h-4" />
        Volver a pedidos
      </Link>

      <PageHeader
        icono={ClipboardList}
        titulo={`Pedido #${pedido.id}`}
        subtitulo={formatoLargo(pedido.fecha)}
      />

      {comidasHabilitadas.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {comidasHabilitadas.map((c) => (
            <button
              key={c.tipo}
              type="button"
              onClick={() => setTipoActivo(c.tipo)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                tipoActivo === c.tipo
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:border-brand-300'
              }`}
            >
              {c.etiqueta}
            </button>
          ))}
        </div>
      )}

      <Card
        titulo={`${totalAnotados} de ${filas.length} ${filas.length === 1 ? 'funcionario anotado' : 'funcionarios anotados'}`}
      >
        {filas.length === 0 ? (
          <EmptyState mensaje="Esta empresa todavía no tiene funcionarios cargados." />
        ) : (
          <div className="overflow-x-auto -m-2 p-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-200">
                  <th className="py-2.5 pr-4 font-medium">Funcionario</th>
                  <th className="py-2.5 pr-4 font-medium">{tipoActivo === 'almuerzo' ? 'Opción' : 'Estado'}</th>
                  {tipoActivo === 'almuerzo' && <th className="py-2.5 pr-4 font-medium">Observación</th>}
                  {puedeEditar && <th className="py-2.5 font-medium text-right">Acción</th>}
                </tr>
              </thead>
              <tbody>
                {filas.map(({ funcionario: f, detalle }) => (
                  <tr key={f.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition">
                    <td className="py-2.5 pr-4 font-medium text-stone-800">{f.nombre_completo}</td>
                    {tipoActivo === 'almuerzo' ? (
                      <>
                        <td className="py-2.5 pr-4 text-stone-600">
                          {detalle?.opcion_numero ? (
                            `Opción ${detalle.opcion_numero} — ${detalle.plato_nombre}`
                          ) : (
                            <Badge color="rojo">Sin pedido</Badge>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-stone-500">{detalle?.observacion || '—'}</td>
                      </>
                    ) : (
                      <td className="py-2.5 pr-4">
                        {detalle ? (
                          <Badge color="brand">Confirmado</Badge>
                        ) : (
                          <span className="text-stone-400">Sin marcar</span>
                        )}
                      </td>
                    )}
                    {puedeEditar && (
                      <td className="py-2.5 text-right">
                        {tipoActivo === 'almuerzo' ? (
                          !detalle?.opcion_numero && (
                            <Button variante="fantasma" tamanio="sm" onClick={() => abrirModal(f, detalle)}>
                              <Pencil className="w-3.5 h-3.5" />
                              Elegir menú
                            </Button>
                          )
                        ) : (
                          <Button
                            variante={detalle ? 'secundario' : 'primario'}
                            tamanio="sm"
                            cargando={funcionarioMarcando === f.id}
                            onClick={() => alternarSimple(f, detalle)}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {detalle ? 'Quitar' : 'Marcar'}
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
        <Modal abierto={!!modalFuncionario} onCerrar={cerrarModal} titulo={modalFuncionario.nombre_completo}>
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
        </Modal>
      )}
    </div>
  );
}
