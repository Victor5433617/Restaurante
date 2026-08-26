import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  UtensilsCrossed,
  ChefHat,
  ArrowRight,
  Inbox,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as empresaService from '../services/empresaService';
import * as funcionarioService from '../services/funcionarioService';
import * as pedidoService from '../services/pedidoService';
import * as menuService from '../services/menuService';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { hoyISO, fechaISO, formatoLargo } from '../utils/fechas';

const estadoVisual = (almuerzos) =>
  almuerzos > 0 ? { texto: 'Con pedido', color: 'verde' } : { texto: 'Sin pedido', color: 'rojo' };

const saludo = () => {
  const h = new Date().getHours();
  if (h < 12) return '¡Buenos días';
  if (h < 19) return '¡Buenas tardes';
  return '¡Buenas noches';
};

export default function DashboardPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const [empresas, funcionarios, conteos, pedidos, menu] = await Promise.all([
          empresaService.listarEmpresas(),
          funcionarioService.listarFuncionarios(),
          empresaService.conteoHoy(),
          pedidoService.listarPedidos(),
          menuService.menuHoy(),
        ]);
        if (!vigente) return;
        const hoy = hoyISO();
        const filas = empresas.map((e) => ({
          ...e,
          funcionarios: funcionarios.filter((f) => f.empresa_id === e.id).length,
          almuerzos: Number(
            conteos.find((c) => c.empresa_id === e.id)?.total_pedidos ?? 0
          ),
          pedido: pedidos.find((p) => p.empresa_id === e.id && fechaISO(p.fecha) === hoy),
        }));
        setDatos({
          filas,
          totalAlmuerzos: filas.reduce((acc, f) => acc + f.almuerzos, 0),
          sinPedido: filas.filter((f) => !f.pedido).length,
          menu,
        });
      } catch (err) {
        if (vigente) setError(err.response?.data?.error || 'No se pudo cargar el resumen.');
      }
    })();
    return () => {
      vigente = false;
    };
  }, []);

  if (error) {
    return (
      <Alert tipo="error" className="max-w-xl mx-auto mt-10">
        {error}
      </Alert>
    );
  }

  if (!datos) {
    return <Spinner texto="Cargando resumen del día..." className="py-24" />;
  }

  const nombre =
    usuario?.email?.split('@')[0].charAt(0).toUpperCase() +
    usuario?.email?.split('@')[0].slice(1);

  const stats = [
    ...(esAdmin
      ? [{ etiqueta: 'Empresas activas', valor: datos.filas.length, icono: Building2 }]
      : []),
    esAdmin
      ? { etiqueta: 'Pedidos de hoy', valor: datos.filas.length - datos.sinPedido, icono: UtensilsCrossed }
      : { etiqueta: 'Almuerzos de hoy', valor: datos.totalAlmuerzos, icono: UtensilsCrossed },
    { etiqueta: 'Funcionarios', valor: datos.filas.reduce((a, f) => a + f.funcionarios, 0), icono: Users },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`${saludo()}, ${nombre}! 👋`}
        subtitulo={`Resumen de hoy — ${formatoLargo(new Date())}`}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.etiqueta}
            className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex items-center gap-3.5"
          >
            <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <s.icono className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-stone-900 leading-none">{s.valor}</p>
              <p className="text-xs text-stone-500 mt-1 truncate">{s.etiqueta}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {esAdmin ? (
          <Card
            titulo="Pedidos por empresa — Hoy"
            subtitulo={`${datos.totalAlmuerzos} almuerzos solicitados en total`}
            className="lg:col-span-2"
          >
            {datos.filas.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-stone-400">
                <Inbox className="w-8 h-8" />
                <p className="text-sm">No hay empresas registradas todavía.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -m-2 p-2">
                <table className="w-full text-sm min-w-[540px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-200">
                      <th className="py-2.5 pr-4 font-medium">Empresa</th>
                      <th className="py-2.5 pr-4 font-medium text-right">Funcionarios</th>
                      <th className="py-2.5 pr-4 font-medium text-right">Almuerzos</th>
                      <th className="py-2.5 pr-4 font-medium">Estado</th>
                      <th className="py-2.5 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.filas.map((f) => {
                      const est = estadoVisual(f.almuerzos);
                      return (
                        <tr key={f.id} className="border-b border-stone-100 last:border-0">
                          <td className="py-3 pr-4 font-medium text-stone-800">{f.nombre}</td>
                          <td className="py-3 pr-4 text-stone-600 text-right tabular-nums">
                            {f.funcionarios}
                          </td>
                          <td className="py-3 pr-4 text-stone-600 text-right tabular-nums">
                            {f.almuerzos}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge color={est.color}>{est.texto}</Badge>
                          </td>
                          <td className="py-3 text-right">
                            <Button
                              variante="fantasma"
                              tamanio="sm"
                              onClick={() => navigate(`/empresas/${f.id}`)}
                            >
                              Ver
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ) : (
          <Card titulo="Tu pedido de hoy" className="lg:col-span-2">
            {(() => {
              const miFila = datos.filas[0];
              const est = estadoVisual(miFila?.almuerzos);
              return (
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                  <div>
                    <p className="font-display text-4xl font-semibold text-brand-700 leading-none">
                      {miFila?.almuerzos ?? 0}
                    </p>
                    <p className="text-sm text-stone-600 mt-1.5">
                      {miFila?.almuerzos === 1 ? 'almuerzo cargado hoy' : 'almuerzos cargados hoy'}
                    </p>
                  </div>
                  <div className="h-10 w-px bg-stone-200 hidden sm:block" />
                  <div className="text-sm">
                    <p className="text-stone-500 mb-1">Estado del pedido</p>
                    <Badge color={est.color}>{est.texto}</Badge>
                  </div>
                  <Button
                    variante="secundario"
                    tamanio="sm"
                    className="ml-auto"
                    onClick={() => navigate('/pedido')}
                  >
                    Cargar / editar pedido
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })()}
          </Card>
        )}

        <Card titulo="Menú de hoy" subtitulo={formatoLargo(new Date())} icono={ChefHat}>
          <div className="h-32 rounded-xl bg-gradient-to-br from-brand-600 to-espresso-900 flex flex-col items-center justify-center gap-1.5 text-white/90 mb-4">
            <UtensilsCrossed className="w-8 h-8" />
            <span className="text-xs font-medium tracking-wide uppercase text-white/70">
              Menú del día
            </span>
          </div>
          {datos.menu.length === 0 ? (
            <Alert tipo="aviso">Todavía no se cargó el menú de hoy.</Alert>
          ) : (
            <ul className="space-y-3">
              {datos.menu.map((m) => (
                <li key={m.id} className="flex items-start gap-2.5">
                  <Badge color="brand" className="mt-0.5 shrink-0">
                    Opción {m.opcion_numero}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-800 leading-snug">
                      {m.plato_nombre}
                    </p>
                    {m.descripcion && (
                      <p className="text-xs text-stone-500 leading-snug">{m.descripcion}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
