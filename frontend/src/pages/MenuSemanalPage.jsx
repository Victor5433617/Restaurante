import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ShieldCheck, History, Settings } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import CargaMenuSemanal from '../components/CargaMenuSemanal';
import HistorialMenuSemanal from '../components/HistorialMenuSemanal';
import UserManagementPanel from '../components/UserManagementPanel';
import LogoUploader from '../components/LogoUploader';
import * as configService from '../services/configService';
import { logoUrl } from '../utils/urls';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';

function ConfiguracionGeneralWrapper() {
  const [configuracion, setConfiguracion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const datos = await configService.obtenerConfiguracion();
      setConfiguracion(datos);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar la configuración.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (cargando) return <Spinner texto="Cargando configuración..." />;
  if (error) return <Alert tipo="error">{error}</Alert>;

  return (
    <LogoUploader
      titulo="Logo del Comedor"
      subtitulo="Aparece en el encabezado de los reportes PDF."
      logoUrl={logoUrl(configuracion?.logo_comedor_url)}
      onSubir={(archivo) => configService.subirLogoComedor(archivo).then(cargar)}
    />
  );
}

const OPCIONES = [
  {
    tab: 'usuarios',
    icono: ShieldCheck,
    titulo: 'Gestión de usuarios',
    descripcion: 'Crear y administrar las cuentas de administrador del sistema.',
  },
  {
    tab: 'cargar',
    icono: CalendarDays,
    titulo: 'Cargar menú semanal',
    descripcion: 'Planificá las opciones de menú para cada día de la semana.',
  },
  {
    tab: 'historial',
    icono: History,
    titulo: 'Historial de menús cargados',
    descripcion: 'Consultá y filtrá por rango de fechas todo lo que se cargó.',
  },
  {
    tab: 'configuracion',
    icono: Settings,
    titulo: 'Configuración general',
    descripcion: 'Logo del comedor, usado en el encabezado de los reportes PDF.',
  },
];

export default function MenuSemanalPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const opcion = OPCIONES.find((o) => o.tab === tab);

  if (!opcion) {
    return (
      <div className="space-y-6">
        <PageHeader icono={CalendarDays} titulo="Menú semanal" subtitulo="Elegí qué querés hacer." />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,260px))] gap-4">
          {OPCIONES.map((o) => (
            <Link key={o.tab} to={`/menu?tab=${o.tab}`}>
              <Card className="h-full hover:-translate-y-0.5 hover:shadow-md hover:border-brand-200 transition duration-200 cursor-pointer">
                <div className="flex flex-col items-center text-center gap-3 py-2">
                  <span className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <o.icono className="w-[22px] h-[22px]" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-stone-800">{o.titulo}</h3>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">{o.descripcion}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/menu"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Menú semanal
      </Link>

      <PageHeader icono={opcion.icono} titulo={opcion.titulo} subtitulo={opcion.descripcion} />

      {opcion.tab === 'usuarios' && <UserManagementPanel scope="global" />}
      {opcion.tab === 'cargar' && <CargaMenuSemanal />}
      {opcion.tab === 'historial' && <HistorialMenuSemanal />}
      {opcion.tab === 'configuracion' && <ConfiguracionGeneralWrapper />}
    </div>
  );
}

