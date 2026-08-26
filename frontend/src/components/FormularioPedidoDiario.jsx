import { useEffect, useState } from 'react';
import { ClipboardList, ChefHat, Search, Inbox, X, Pencil, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as empresaService from '../services/empresaService';
import * as funcionarioService from '../services/funcionarioService';
import * as menuService from '../services/menuService';
import * as pedidoService from '../services/pedidoService';
import PageHeader from './ui/PageHeader';
import Spinner from './ui/Spinner';
import Alert from './ui/Alert';
import Badge from './ui/Badge';
import Button from './ui/Button';
import Input from './ui/Input';
import { hoyISO } from '../utils/fechas';

const fechaLarga = () => {
  const fecha = new Date().toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return fecha.charAt(0).toUpperCase() + fecha.slice(1);
};

export default function FormularioPedidoDiario() {
  const { usuario, cerrarSesion } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [empresaId, setEmpresaId] = useState(usuario.empresa_id ?? '');
  const [funcionarios, setFuncionarios] = useState([]);
  const [menu, setMenu] = useState([]);
  const [selecciones, setSelecciones] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardandoModal, setGuardandoModal] = useState(false);
  const [error, setError] = useState('');

  const [modalFuncionario, setModalFuncionario] = useState(null);
  const [draftMenuId, setDraftMenuId] = useState('');
  const [draftObservacion, setDraftObservacion] = useState('');

  useEffect(() => {
    const cargarBase = async () => {
      const [todosFuncionarios, menuDeHoy] = await Promise.all([
        funcionarioService.listarFuncionarios(),
        menuService.menuHoy(),
      ]);
      setFuncionarios(todosFuncionarios);
      setMenu(menuDeHoy);

      if (usuario.rol === 'admin') {
        const todasEmpresas = await empresaService.listarEmpresas();
        setEmpresas(todasEmpresas);
      }
      setCargando(false);
    };
    cargarBase();
  }, [usuario.rol]);

  useEffect(() => {
    const intervalo = setInterval(async () => {
      try {
        const todosFuncionarios = await funcionarioService.listarFuncionarios();
        setFuncionarios(todosFuncionarios);
      } catch (error) {
        console.log(error);
      }
    }, 10000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const rehidratar = async () => {
      if (!empresaId) {
        setSelecciones({});
        return;
      }
      try {
        const pedidos = await pedidoService.listarPedidos();
        const pedidoHoy = pedidos.find(
          (p) => p.empresa_id === Number(empresaId) && p.fecha?.slice(0, 10) === hoyISO()
        );
        if (!pedidoHoy) {
          setSelecciones({});
          return;
        }
        const detalle = await pedidoService.obtenerDetallePedido(pedidoHoy.id);
        const nuevasSelecciones = {};
        for (const d of detalle.detalles) {
          nuevasSelecciones[d.funcionario_id] = {
            pidio: true,
            menu_semanal_id: d.menu_semanal_id,
            observacion: d.observacion || '',
          };
        }
        setSelecciones(nuevasSelecciones);
      } catch {
        setError('No se pudieron cargar los pedidos ya guardados de hoy.');
      }
    };
    rehidratar();
  }, [empresaId]);

  const funcionariosEmpresa = funcionarios
    .filter((f) => f.empresa_id === Number(empresaId))
    .filter((f) => f.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()));

  const cambiarSeleccion = (funcionarioId, campo, valor) => {
    setSelecciones((prev) => ({
      ...prev,
      [funcionarioId]: { ...prev[funcionarioId], [campo]: valor },
    }));
  };

  const totalSeleccionados = Object.values(selecciones).filter(
    (sel) => sel?.pidio && sel?.menu_semanal_id
  ).length;

  const abrirModal = (f) => {
    const sel = selecciones[f.id] || {};
    setModalFuncionario(f);
    setDraftMenuId(sel.menu_semanal_id ? String(sel.menu_semanal_id) : '');
    setDraftObservacion(sel.observacion || '');
  };

  const cerrarModal = () => setModalFuncionario(null);

  const guardarSeleccionModal = async () => {
    if (!draftMenuId || !modalFuncionario || !empresaId) return;
    setError('');
    setGuardandoModal(true);
    try {
      await pedidoService.anotarFuncionario({
        empresa_id: Number(empresaId),
        funcionario_id: modalFuncionario.id,
        menu_semanal_id: Number(draftMenuId),
        observacion: draftObservacion || '',
      });
      cambiarSeleccion(modalFuncionario.id, 'pidio', true);
      cambiarSeleccion(modalFuncionario.id, 'menu_semanal_id', draftMenuId);
      cambiarSeleccion(modalFuncionario.id, 'observacion', draftObservacion);
      cerrarModal();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar la selección');
    } finally {
      setGuardandoModal(false);
    }
  };

  const quitarSeleccionModal = async () => {
    if (!modalFuncionario || !empresaId) return;
    setError('');
    setGuardandoModal(true);
    try {
      await pedidoService.quitarFuncionario({
        empresa_id: Number(empresaId),
        funcionario_id: modalFuncionario.id,
      });
      cambiarSeleccion(modalFuncionario.id, 'pidio', false);
      cerrarModal();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo quitar el pedido');
    } finally {
      setGuardandoModal(false);
    }
  };

  if (cargando) {
    return <Spinner texto="Preparando el pedido de hoy..." />;
  }

  const clasesSelect =
    'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 transition focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400';

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      <PageHeader
        icono={ClipboardList}
        titulo="Cargar Pedido de Hoy"
        subtitulo={fechaLarga()}
        acciones={
          usuario.rol === 'funcionario' && (
            <Button variante="secundario" tamanio="sm" onClick={cerrarSesion}>
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </Button>
          )
        }
      />

      {usuario.rol === 'admin' && (
        <div>
          <label htmlFor="empresa" className="block text-sm font-medium text-stone-600 mb-1.5">
            Empresa
          </label>
          <select
            id="empresa"
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            className={`${clasesSelect} sm:max-w-xs`}
          >
            <option value="">Elegir empresa...</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <Alert tipo="error">{error}</Alert>}

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-3 lg:col-span-2">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar funcionario por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            {funcionariosEmpresa.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-stone-400">
                <Inbox className="w-8 h-8" />
                <p className="text-sm">
                  {empresaId
                    ? busqueda
                      ? 'No se encontraron funcionarios con ese nombre.'
                      : 'Esta empresa todavía no tiene funcionarios cargados.'
                    : 'Elegí una empresa para ver sus funcionarios.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-200 bg-cream-50">
                      <th className="py-3 pl-5 pr-4 font-medium">Funcionario</th>
                      <th className="py-3 pr-4 font-medium">Selección</th>
                      <th className="py-3 pr-5 font-medium text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funcionariosEmpresa.map((f) => {
                      const sel = selecciones[f.id];
                      const tienePedido = sel?.pidio && sel?.menu_semanal_id;
                      const opcionElegida = tienePedido
                        ? menu.find((m) => String(m.id) === String(sel.menu_semanal_id))
                        : null;
                      return (
                        <tr
                          key={f.id}
                          onClick={() => abrirModal(f)}
                          className="border-b border-stone-100 last:border-0 cursor-pointer hover:bg-cream-50/60 transition"
                        >
                          <td className="py-3 pl-5 pr-4">
                            <span className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-brand-50 ring-1 ring-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center uppercase shrink-0">
                                {f.nombre_completo.charAt(0)}
                              </span>
                              <span className="font-medium text-stone-800">{f.nombre_completo}</span>
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            {opcionElegida ? (
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge color="brand">Opción {opcionElegida.opcion_numero}</Badge>
                                  <span className="text-stone-700">{opcionElegida.plato_nombre}</span>
                                </div>
                                {sel.observacion && (
                                  <p className="text-xs text-stone-500 mt-0.5">{sel.observacion}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-stone-400">Sin seleccionar</span>
                            )}
                          </td>
                          <td className="py-3 pr-5 text-right">
                            <Button
                              type="button"
                              variante="fantasma"
                              tamanio="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirModal(f);
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              {opcionElegida ? 'Editar' : 'Elegir menú'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {funcionariosEmpresa.length > 0 && (
            <p className="text-center text-xs text-stone-400 pt-1">
              {totalSeleccionados > 0
                ? `${totalSeleccionados} funcionario(s) con pedido guardado.`
                : 'Elegí un funcionario para cargar su menú.'}
            </p>
          )}
        </div>

        <section className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 lg:sticky lg:top-20">
          <h2 className="flex items-center gap-2 font-display font-semibold text-stone-800 mb-3">
            <ChefHat className="w-5 h-5 text-brand-500" />
            Menú de hoy
          </h2>
          {menu.length === 0 ? (
            <Alert tipo="aviso">Todavía no se cargó el menú de hoy.</Alert>
          ) : (
            <div className="space-y-2.5">
              {menu.map((m) => (
                <div key={m.id} className="rounded-lg border border-stone-200 bg-cream-50/60 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge color="brand">Opción {m.opcion_numero}</Badge>
                  </div>
                  <p className="text-sm font-medium text-stone-800">{m.plato_nombre}</p>
                  {m.descripcion && (
                    <p className="text-xs text-stone-500 mt-0.5 leading-snug">{m.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

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

            {menu.length === 0 ? (
              <Alert tipo="aviso">Todavía no se cargó el menú de hoy.</Alert>
            ) : (
              <div className="space-y-2">
                {menu.map((m) => {
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

            <div className="flex items-center justify-between gap-2 pt-2">
              {selecciones[modalFuncionario.id]?.pidio ? (
                <button
                  type="button"
                  disabled={guardandoModal}
                  onClick={quitarSeleccionModal}
                  className="text-sm font-medium text-red-600 hover:text-red-700 transition disabled:opacity-50"
                >
                  Quitar pedido
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button variante="secundario" tamanio="sm" type="button" onClick={cerrarModal} disabled={guardandoModal}>
                  Cancelar
                </Button>
                <Button
                  tamanio="sm"
                  type="button"
                  disabled={!draftMenuId || guardandoModal}
                  cargando={guardandoModal}
                  onClick={guardarSeleccionModal}
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
