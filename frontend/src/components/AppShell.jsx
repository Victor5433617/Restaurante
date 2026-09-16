import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  LayoutDashboard,
  Building2,
  Users,
  CalendarDays,
  ClipboardList,
  BarChart3,
  Settings,
  FileSpreadsheet,
  LogOut,
  Home,
  ArrowLeft,
  MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Badge from './ui/Badge';
import * as configService from '../services/configService';
import { logoUrl } from '../utils/urls';

const ITEMS = [
  { to: '/dashboard', etiqueta: 'Dashboard', icono: LayoutDashboard, ocultoParaAdmin: true },
  { to: '/', etiqueta: 'Empresas', icono: Building2, fin: true, soloAdmin: true },
  { to: '/funcionarios', etiqueta: 'Funcionarios', icono: Users, ocultoParaAdmin: true },
  { to: '/menu', etiqueta: 'Menú semanal', icono: CalendarDays, soloAdmin: true },
  { to: '/pedidos', etiqueta: 'Pedidos diarios', icono: ClipboardList, ocultoParaAdmin: true },
  { to: '/reportes', etiqueta: 'Reportes', icono: BarChart3, ocultoParaAdmin: true },
  { to: '/configuracion', etiqueta: 'Configuración', icono: Settings, ocultoParaAdmin: true },
];

const ITEMS_EMPRESA = [
  { tab: 'almuerzos-hoy', etiqueta: 'Almuerzos de hoy', icono: UtensilsCrossed },
  { tab: 'pedidos', etiqueta: 'Pedidos diarios', icono: ClipboardList },
  { tab: 'funcionarios', etiqueta: 'Funcionarios', icono: Users },
  { tab: 'consumo', etiqueta: 'Consumo de hoy', icono: BarChart3 },
  { tab: 'reportes', etiqueta: 'Reportes', icono: FileSpreadsheet },
  { tab: 'configuracion', etiqueta: 'Configuración', icono: Settings },
];

function LogoMarca({ logoComedorUrl }) {
  if (logoComedorUrl) {
    return (
      <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0 overflow-hidden ring-1 ring-black/5">
        <img src={logoComedorUrl} alt="Logo del comedor" className="w-full h-full object-contain p-0.5" />
      </span>
    );
  }
  return (
    <span className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm shrink-0">
      <UtensilsCrossed className="w-[18px] h-[18px]" />
    </span>
  );
}

export default function AppShell({ children }) {
  const { usuario, cerrarSesion } = useAuth();
  const [logoComedorUrl, setLogoComedorUrl] = useState(null);

  useEffect(() => {
    configService
      .obtenerConfiguracionPublica()
      .then((cfg) => setLogoComedorUrl(logoUrl(cfg?.logo_comedor_url)))
      .catch(() => setLogoComedorUrl(null));
  }, []);
  const [menuMas, setMenuMas] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const matchEmpresa = location.pathname.match(/^\/empresas\/(\d+)/);
  const dentroDeEmpresa = !!matchEmpresa && usuario?.rol === 'admin';
  const empresaId = matchEmpresa?.[1];
  const tabActivo = new URLSearchParams(location.search).get('tab') || 'configuracion';

  const visibles = ITEMS.filter(
    (i) => (!i.soloAdmin || usuario?.rol === 'admin') && (!i.ocultoParaAdmin || usuario?.rol !== 'admin')
  ).map((item) => ({
    ...item,
    activo: item.fin ? location.pathname === item.to : location.pathname.startsWith(item.to),
  }));

  const itemsEmpresa = ITEMS_EMPRESA.map((item) => ({
    to: `/empresas/${empresaId}?tab=${item.tab}`,
    etiqueta: item.etiqueta,
    icono: item.icono,
    activo: tabActivo === item.tab,
  }));

  const salir = () => {
    cerrarSesion();
    navigate('/login');
  };

  // Admin fuera de una empresa: sin sidebar, "Empresas"/"Menú semanal" arriba en una barra horizontal.
  if (usuario?.rol === 'admin' && !dentroDeEmpresa) {
    return (
      <div className="min-h-screen bg-cream-50">
        <header className="fixed top-0 inset-x-0 z-40 h-16 bg-espresso-900 flex items-center justify-between gap-4 px-4 sm:px-6 shadow-md shadow-black/10">
          <div className="flex items-center gap-2 sm:gap-6 min-w-0">
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <LogoMarca logoComedorUrl={logoComedorUrl} />
              <span className="leading-tight hidden sm:block">
                <p className="text-cream-50 font-semibold text-[15px] tracking-tight">Comensa</p>
                <p className="text-brand-300 text-xs font-medium">App</p>
              </span>
            </Link>
            <nav className="flex items-center gap-1 overflow-x-auto">
              {visibles.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    item.activo
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-stone-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <item.icono className="w-[18px] h-[18px] shrink-0" />
                  {item.etiqueta}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="text-xs text-stone-300 max-w-[140px] truncate hidden sm:block">
              {usuario?.email}
            </span>
            <Badge color="brand" className="hidden sm:inline-flex">
              {usuario?.rol}
            </Badge>
            <button
              onClick={salir}
              title="Cerrar sesión"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/10 transition"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </header>

        <main className="pt-20 pb-5 px-4 sm:px-6">{children}</main>
      </div>
    );
  }

  const itemsSidebar = dentroDeEmpresa ? itemsEmpresa : visibles;

  return (
    <div className="min-h-screen bg-cream-50">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-espresso-900 flex-col z-40 shadow-xl shadow-black/10">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10 shrink-0">
          <LogoMarca logoComedorUrl={logoComedorUrl} />
          <span className="leading-tight">
            <p className="text-cream-50 font-semibold text-[15px] tracking-tight">Comensa</p>
            <p className="text-brand-300 text-xs font-medium">App</p>
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {dentroDeEmpresa && (
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-300 hover:text-white hover:bg-white/10 transition mb-1"
            >
              <ArrowLeft className="w-[18px] h-[18px] shrink-0" />
              Volver a Empresas
            </Link>
          )}
          {itemsSidebar.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                item.activo
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <item.icono className="w-[18px] h-[18px] shrink-0" />
              {item.etiqueta}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4 pt-3 border-t border-white/10 space-y-2 shrink-0">
          <button
            onClick={salir}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-300 hover:text-white hover:bg-red-500/20 hover:text-red-200 transition"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Cerrar sesión
          </button>
          <div className="flex items-center gap-2.5 px-3">
            <span className="w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-semibold flex items-center justify-center uppercase shrink-0">
              {usuario?.email?.charAt(0)}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="text-xs text-stone-300 truncate">{usuario?.email}</p>
              <Badge color={usuario?.rol === 'admin' ? 'brand' : 'ambar'} className="mt-0.5">
                {usuario?.rol}
              </Badge>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 z-40 bg-espresso-900 pl-4 pr-2 h-14 flex items-center justify-between shadow-md shadow-black/10">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <LogoMarca logoComedorUrl={logoComedorUrl} />
            <span className="font-semibold text-cream-50 text-[15px] tracking-tight">
              Comensa App
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <span className="text-xs text-stone-300 max-w-[110px] truncate hidden sm:block">
              {usuario?.email}
            </span>
            <button
              onClick={salir}
              title="Cerrar sesión"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/10 transition"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-5 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-stone-200 grid grid-cols-4 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        {(dentroDeEmpresa
          ? [
              { to: '/', etiqueta: 'Empresas', icono: Building2, fin: true },
              { to: '/pedido', etiqueta: 'Pedido', icono: ClipboardList },
              { to: `/empresas/${empresaId}?tab=reportes`, etiqueta: 'Reportes', icono: BarChart3 },
            ]
          : [
              { to: '/dashboard', etiqueta: 'Inicio', icono: Home, fin: true },
              { to: '/pedido', etiqueta: 'Pedido', icono: ClipboardList },
              { to: '/reportes', etiqueta: 'Historial', icono: BarChart3 },
            ]
        ).map((item) => {
          const activo = item.fin ? location.pathname === item.to : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center py-2.5 gap-0.5 text-[11px] font-medium transition ${
                activo ? 'text-brand-600' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <item.icono className="w-5 h-5" />
              {item.etiqueta}
            </NavLink>
          );
        })}
        <button
          onClick={() => setMenuMas(true)}
          className={`flex flex-col items-center justify-center py-2.5 gap-0.5 text-[11px] font-medium transition ${
            menuMas ? 'text-brand-600' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          Más
        </button>
      </nav>

      {menuMas && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-espresso-900/60 backdrop-blur-sm"
            onClick={() => setMenuMas(false)}
          />
          <div className="absolute bottom-16 inset-x-3 rounded-2xl bg-white shadow-2xl p-2 space-y-0.5 max-h-[70vh] overflow-y-auto">
            {dentroDeEmpresa && (
              <NavLink
                to="/"
                onClick={() => setMenuMas(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-700 hover:bg-brand-50 hover:text-brand-700 transition"
              >
                <ArrowLeft className="w-[18px] h-[18px] text-stone-400" />
                Volver a Empresas
              </NavLink>
            )}
            {itemsSidebar.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuMas(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-700 hover:bg-brand-50 hover:text-brand-700 transition"
              >
                <item.icono className="w-[18px] h-[18px] text-stone-400" />
                {item.etiqueta}
              </NavLink>
            ))}
            <div className="border-t border-stone-100 my-1" />
            <button
              onClick={salir}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-[18px] h-[18px]" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

