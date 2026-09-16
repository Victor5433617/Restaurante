import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, ChefHat, Search, Pencil, LogOut, Check } from 'lucide-react';
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
import Select from './ui/Select';
import Modal from './ui/Modal';
import EmptyState from './ui/EmptyState';
import { hoyISO, formatoLargo } from '../utils/fechas';

const COMIDAS = [
  { tipo: 'desayuno', campo: 'habilita_desayuno', etiqueta: 'Desayuno' },
  { tipo: 'almuerzo', campo: 'habilita_almuerzo', etiqueta: 'Almuerzo' },
  { tipo: 'merienda', campo: 'habilita_merienda', etiqueta: 'Merienda' },
  { tipo: 'cena', campo: 'habilita_cena', etiqueta: 'Cena' },
];

export default function FormularioPedidoDiario() {
  const { usuario, cerrarSesion } = useAuth();
  const [searchParams] = useSearchParams();
  const empresaFijaId = searchParams.get('empresa_id');
  const puedeElegirFecha = usuario.rol === 'admin' || usuario.rol === 'encargada';
  const [empresas, setEmpresas] = useState([]);
  const [empresaId, setEmpresaId] = useState(usuario.empresa_id ?? empresaFijaId ?? '');
  const [fecha, setFecha] = useState(hoyISO());
  const [funcionarios, setFuncionarios] = useState([]);
  const [menu, setMenu] = useState([]);
  const [seleccionesPorTipo, setSeleccionesPorTipo] = useState({});
  const [tipoActivo, setTipoActivo] = useState('almuerzo');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardandoModal, setGuardandoModal] = useState(false);
  const [funcionarioMarcando, setFuncionarioMarcando] = useState(null);
  const [error, setError] = useState('');

  const [modalFuncionario, setModalFuncionario] = useState(null);
  const [draftMenuId, setDraftMenuId] = useState('');
  const [draftObservacion, setDraftObservacion] = useState('');

  useEffect(() => {
    const cargarBase = async () => {
      const [todosFuncionarios, todasEmpresas] = await Promise.all([
        funcionarioService.listarFuncionarios(),
        empresaService.listarEmpresas(),
      ]);
      setFuncionarios(todosFuncionarios);
      setEmpresas(todasEmpresas);
      setCargando(false);
    };
    cargarBase();
  }, []);

  const empresaActual = empresas.find((e) => e.id === Number(empresaId));
  const comidasHabilitadas = COMIDAS.filter((c) => empresaActual?.[c.campo]);

  useEffect(() => {
    if (comidasHabilitadas.length === 0) return;
    if (!comidasHabilitadas.some((c) => c.tipo === tipoActivo)) {
      setTipoActivo(comidasHabilitadas[0].tipo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, empresaActual]);

  useEffect(() => {
    const cargarMenu = async () => {
      try {
        const menuDelDia = fecha === hoyISO()
          ? await menuService.menuHoy()
          : await menuService.menuPorFecha(fecha);
        setMenu(menuDelDia);
      } catch {
        setMenu([]);
      }
    };
    cargarMenu();
  }, [fecha]);

  useEffect(() => {
    const intervalo = setInterval(async () => {
      try {
        const todosFuncionarios = await funcionarioService.listarFuncionarios();
        setFuncionarios(todosFuncionarios);
      } catch {
        // sin cambio silencioso durante polling
      }
    }, 10000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const rehidratar = async () => {
      if (!empresaId) {
        setSeleccionesPorTipo({});
        return;
      }
      try {
        const pedidos = await pedidoService.listarPedidos();
        const pedidoDelDia = pedidos.find(
          (p) => p.empresa_id === Number(empresaId) && p.fecha?.slice(0, 10) === fecha
        );
        if (!pedidoDelDia) {
          setSeleccionesPorTipo({});
          return;
        }
        const detalle = await pedidoService.obtenerDetallePedido(pedidoDelDia.id);
        const nuevas = {};
        for (const d of detalle.detalles) {
          const tipo = d.tipo_comida || 'almuerzo';
          if (!nuevas[tipo]) nuevas[tipo] = {};
          nuevas[tipo][d.funcionario_id] = {
            pidio: true,
            menu_semanal_id: d.menu_semanal_id,
            observacion: d.observacion || '',
          };
        }
        setSeleccionesPorTipo(nuevas);
      } catch {
        setError('No se pudieron cargar los pedidos ya guardados de ese día.');
      }
    };
    rehidratar();
  }, [empresaId, fecha]);

  const funcionariosEmpresa = funcionarios
    .filter((f) => f.empresa_id === Number(empresaId))
    .filter((f) => f.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()));

  const selecciones = seleccionesPorTipo[tipoActivo] || {};

  const cambiarSeleccion = (funcionarioId, campo, valor) => {
    setSeleccionesPorTipo((prev) => ({
      ...prev,
      [tipoActivo]: {
        ...prev[tipoActivo],
        [funcionarioId]: { ...prev[tipoActivo]?.[funcionarioId], [campo]: valor },
      },
    }));
  };

  const totalSeleccionados = Object.values(selecciones).filter((sel) =>
    tipoActivo === 'almuerzo' ? sel?.pidio && sel?.menu_semanal_id : sel?.pidio
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
        tipo_comida: 'almuerzo',
        ...(puedeElegirFecha ? { fecha } : {}),
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
        tipo_comida: 'almuerzo',
        ...(puedeElegirFecha ? { fecha } : {}),
      });
      cambiarSeleccion(modalFuncionario.id, 'pidio', false);
      cerrarModal();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo quitar el pedido');
    } finally {
      setGuardandoModal(false);
    }
  };

  const alternarSimple = async (f) => {
    if (!empresaId) return;
    const yaMarcado = selecciones[f.id]?.pidio;
    setError('');
    setFuncionarioMarcando(f.id);
    try {
      if (yaMarcado) {
        await pedidoService.quitarFuncionario({
          empresa_id: Number(empresaId),
          funcionario_id: f.id,
          tipo_comida: tipoActivo,
          ...(puedeElegirFecha ? { fecha } : {}),
        });
        cambiarSeleccion(f.id, 'pidio', false);
      } else {
        await pedidoService.anotarFuncionario({
          empresa_id: Number(empresaId),
          funcionario_id: f.id,
          tipo_comida: tipoActivo,
          ...(puedeElegirFecha ? { fecha } : {}),
        });
        cambiarSeleccion(f.id, 'pidio', true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar la marca.');
    } finally {
      setFuncionarioMarcando(null);
    }
  };

  if (cargando) {
    return <Spinner texto="Preparando el pedido de hoy..." />;
  }

  const opcionesEmpresa = empresas.map((e) => ({ valor: String(e.id), etiqueta: e.nombre }));
  const empresaBloqueada = usuario.rol === 'admin' && Boolean(empresaFijaId);
  const tituloPagina = puedeElegirFecha ? 'Cargar Pedido' : 'Cargar Pedido de Hoy';

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      <PageHeader
        icono={ClipboardList}
        titulo={empresaBloqueada && empresaActual ? `${tituloPagina} — ${empresaActual.nombre}` : tituloPagina}
        subtitulo={formatoLargo(fecha)}
        acciones={
          usuario.rol === 'funcionario' && (
            <Button variante="secundario" tamanio="sm" onClick={cerrarSesion}>
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </Button>
          )
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        {usuario.rol === 'admin' && !empresaBloqueada && (
          <Select
            id="empresa"
            label="Empresa"
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            opciones={opcionesEmpresa}
            placeholder="Elegir empresa..."
            className="sm:max-w-xs"
          />
        )}
        {puedeElegirFecha && (
          <Input
            id="fecha-pedido"
            label="Fecha del pedido"
            type="date"
            value={fecha}
            max={hoyISO()}
            onChange={(e) => setFecha(e.target.value)}
            className="sm:max-w-[180px]"
          />
        )}
      </div>

      {puedeElegirFecha && fecha !== hoyISO() && (
        <Alert tipo="aviso">Estás cargando un pedido de un día anterior ({formatoLargo(fecha)}), no el de hoy.</Alert>
      )}

      {error && <Alert tipo="error">{error}</Alert>}

      {empresaId && comidasHabilitadas.length > 1 && (
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
              <EmptyState
                mensaje={
                  empresaId
                    ? busqueda
                      ? 'No se encontraron funcionarios con ese nombre.'
                      : 'Esta empresa todavía no tiene funcionarios cargados.'
                    : 'Elegí una empresa para ver sus funcionarios.'
                }
              />
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
                      if (tipoActivo !== 'almuerzo') {
                        const marcado = Boolean(sel?.pidio);
                        return (
                          <tr
                            key={f.id}
                            onClick={() => alternarSimple(f)}
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
                              {marcado ? (
                                <Badge color="brand">Confirmado</Badge>
                              ) : (
                                <span className="text-stone-400">Sin marcar</span>
                              )}
                            </td>
                            <td className="py-3 pr-5 text-right">
                              <Button
                                type="button"
                                variante={marcado ? 'secundario' : 'primario'}
                                tamanio="sm"
                                cargando={funcionarioMarcando === f.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  alternarSimple(f);
                                }}
                              >
                                <Check className="w-3.5 h-3.5" />
                                {marcado ? 'Quitar' : 'Marcar'}
                              </Button>
                            </td>
                          </tr>
                        );
                      }

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

        {tipoActivo === 'almuerzo' && (
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
        )}
      </div>

      {modalFuncionario && (
        <Modal abierto={!!modalFuncionario} onCerrar={cerrarModal} titulo={modalFuncionario.nombre_completo}>
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
        </Modal>
      )}
    </div>
  );
}
