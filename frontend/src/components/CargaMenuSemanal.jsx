import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  Drumstick,
  Beef,
  Fish,
  Wheat,
  Salad,
  Soup,
  Carrot,
} from 'lucide-react';
import * as menuService from '../services/menuService';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import {
  DIAS_INICIALES,
  lunesDe,
  sumarDias,
  fechaISO,
  hoyISO,
  formatoCorto,
  etiquetaSemana,
} from '../utils/fechas';

const clasesInput =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 transition focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200';

const iconoParaPlato = (nombre = '') => {
  const t = nombre.toLowerCase();
  if (t.includes('pollo')) return Drumstick;
  if (t.includes('carne') || t.includes('asado') || t.includes('res')) return Beef;
  if (t.includes('pescado')) return Fish;
  if (t.includes('pasta') || t.includes('fideo') || t.includes('tallarin')) return Wheat;
  if (t.includes('ensalada')) return Salad;
  if (t.includes('sopa') || t.includes('guiso')) return Soup;
  if (t.includes('verdura')) return Carrot;
  return UtensilsCrossed;
};

export default function CargaMenuSemanal() {
  const [offset, setOffset] = useState(0);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cola, setCola] = useState([]);
  const [diaForm, setDiaForm] = useState(null);
  const [borrador, setBorrador] = useState({ plato_nombre: '', descripcion: '', opcion_numero: 1 });
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const contadorRef = useRef(0);

  const cargar = () => {
    menuService
      .listarMenu()
      .then(setHistorial)
      .catch(() => setError('No se pudo cargar el menú existente.'))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const inicio = sumarDias(lunesDe(new Date()), offset * 7);
  const dias = Array.from({ length: 6 }, (_, i) => sumarDias(inicio, i));
  const hoy = hoyISO();

  const opcionesPorFecha = {};
  historial.forEach((m) => {
    const iso = fechaISO(m.fecha);
    (opcionesPorFecha[iso] ||= []).push(m);
  });
  Object.values(opcionesPorFecha).forEach((lista) =>
    lista.sort((a, b) => a.opcion_numero - b.opcion_numero)
  );

  const siguienteOpcion = (iso) => {
    const existentes = (opcionesPorFecha[iso] || []).map((m) => m.opcion_numero);
    const enCola = cola.filter((item) => item.fecha === iso).map((item) => item.opcion_numero);
    const maximo = Math.max(0, ...existentes, ...enCola);
    return maximo + 1;
  };

  const agregarACola = (fecha) => {
    if (!borrador.plato_nombre.trim()) return;
    setCola([
      ...cola,
      {
        _id: `nueva-${(contadorRef.current += 1)}`,
        fecha,
        opcion_numero: Number(borrador.opcion_numero) || siguienteOpcion(fecha),
        plato_nombre: borrador.plato_nombre.trim(),
        descripcion: borrador.descripcion.trim(),
      },
    ]);
    setBorrador({ plato_nombre: '', descripcion: '', opcion_numero: siguienteOpcion(fecha) + 1 });
  };

  const quitarDeCola = (_id) => setCola(cola.filter((item) => item._id !== _id));

  const guardarMenu = async () => {
    if (cola.length === 0) return;
    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      const payload = cola.map((item) => ({
        fecha: item.fecha,
        opcion_numero: item.opcion_numero,
        plato_nombre: item.plato_nombre,
        descripcion: item.descripcion,
      }));
      await menuService.crearMenu(payload);
      setMensaje(`Menú guardado: ${payload.length} opción(es) nueva(s).`);
      setCola([]);
      setDiaForm(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el menú.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-3 sm:p-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOffset((o) => o - 1)}
            title="Semana anterior"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition"
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => setOffset((o) => o + 1)}
            title="Semana siguiente"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition"
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>
        <p className="font-semibold text-stone-800 text-sm sm:text-base">
          {etiquetaSemana(dias[0], dias[dias.length - 1])}
        </p>
        {offset === 0 && <Badge color="brand">Esta semana</Badge>}
        <Button
          className="sm:ml-auto"
          onClick={guardarMenu}
          disabled={cola.length === 0}
          cargando={guardando}
        >
          {cola.length > 0 ? `Guardar menú (${cola.length})` : 'Guardar menú'}
        </Button>
      </div>

      {error && <Alert tipo="error">{error}</Alert>}
      {mensaje && <Alert tipo="exito">{mensaje}</Alert>}

      {cargando ? (
        <Spinner texto="Cargando menú..." className="py-16" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
            {dias.map((d, i) => {
              const iso = fechaISO(d);
              const esHoy = iso === hoy;
              const titulo = `${DIAS_INICIALES[i]} ${formatoCorto(iso).slice(0, 5)}`;
              const opciones = opcionesPorFecha[iso] || [];
              const nuevas = cola.filter((item) => item.fecha === iso);
              const primerPlato = opciones[0]?.plato_nombre || nuevas[0]?.plato_nombre;
              const IconoPlato = iconoParaPlato(primerPlato);
              return (
                <div
                  key={iso}
                  className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col ${
                    esHoy ? 'border-brand-300 ring-2 ring-brand-200' : 'border-stone-200'
                  }`}
                >
                  <header className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between bg-cream-50">
                    <span className="text-xs font-bold tracking-wide text-stone-600">
                      {titulo}
                    </span>
                    {esHoy && <Badge color="brand">Hoy</Badge>}
                  </header>

                  <div className="h-20 bg-gradient-to-br from-brand-600 to-espresso-900 flex items-center justify-center text-white/90 shrink-0">
                    <IconoPlato className="w-7 h-7" strokeWidth={1.5} />
                  </div>

                  <ul className="p-3 space-y-2.5 flex-1">
                    {opciones.length === 0 && nuevas.length === 0 && (
                      <li className="text-xs text-stone-400 py-1.5">
                        Sin opciones para este día.
                      </li>
                    )}
                    {opciones.map((m) => (
                      <li key={m.id} className="flex items-start gap-2">
                        <Badge color="brand" className="mt-0.5 shrink-0">
                          Opción {m.opcion_numero}
                        </Badge>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-stone-800 leading-snug">
                            {m.plato_nombre}
                          </p>
                          {m.descripcion && (
                            <p className="text-xs text-stone-500 leading-snug">
                              {m.descripcion}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                    {nuevas.map((item) => (
                      <li key={item._id} className="flex items-start gap-2">
                        <Badge color="ambar" className="mt-0.5 shrink-0">
                          Opción {item.opcion_numero} (nueva)
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-stone-800 leading-snug">
                            {item.plato_nombre}
                          </p>
                          {item.descripcion && (
                            <p className="text-xs text-stone-500 leading-snug">
                              {item.descripcion}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => quitarDeCola(item._id)}
                          title="Quitar"
                          className="w-6 h-6 rounded-md flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="p-3 pt-0 mt-auto">
                    {diaForm === iso ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-stone-500 mb-1 block">Opción N°</label>
                          <input
                            type="number"
                            min="1"
                            value={borrador.opcion_numero}
                            onChange={(e) =>
                              setBorrador({ ...borrador, opcion_numero: e.target.value })
                            }
                            className={clasesInput}
                          />
                        </div>
                        <input
                          placeholder="Nombre del plato"
                          value={borrador.plato_nombre}
                          onChange={(e) =>
                            setBorrador({ ...borrador, plato_nombre: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              agregarACola(iso);
                            }
                          }}
                          autoFocus
                          className={clasesInput}
                        />
                        <input
                          placeholder="Acompañamientos (opcional)"
                          value={borrador.descripcion}
                          onChange={(e) =>
                            setBorrador({ ...borrador, descripcion: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              agregarACola(iso);
                            }
                          }}
                          className={clasesInput}
                        />
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variante="secundario"
                            tamanio="sm"
                            type="button"
                            onClick={() => setDiaForm(null)}
                          >
                            Cerrar
                          </Button>
                          <Button
                            tamanio="sm"
                            type="button"
                            disabled={!borrador.plato_nombre.trim()}
                            onClick={() => agregarACola(iso)}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Agregar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variante="fantasma"
                        tamanio="sm"
                        type="button"
                        className="w-full"
                        onClick={() => {
                          setDiaForm(iso);
                          setBorrador({
                            plato_nombre: '',
                            descripcion: '',
                            opcion_numero: siguienteOpcion(iso),
                          });
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar opción
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
