import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import * as empresaService from '../services/empresaService';
import { useAuth } from '../context/AuthContext';
import LogoUploader from '../components/LogoUploader';
import UserManagementPanel from '../components/UserManagementPanel';
import ConfiguracionComidas from '../components/ConfiguracionComidas';
import { logoUrl } from '../utils/urls';
import SeccionAlmuerzosHoy from '../components/SeccionAlmuerzosHoy';
import ConsumoHoyEmpresa from '../components/ConsumoHoyEmpresa';
import ReporteConsumoDiario from '../components/ReporteConsumoDiario';
import FuncionariosPage from './FuncionariosPage';
import PedidosPage from './PedidosPage';
import ReportesPage from './ReportesPage';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';

export default function EmpresaDetailPage() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const [searchParams] = useSearchParams();

  const [empresa, setEmpresa] = useState(null);
  const activa = searchParams.get('tab') || (esAdmin ? 'configuracion' : 'almuerzos-hoy');

  const cargar = async () => {
    const todas = await empresaService.listarEmpresas();
    setEmpresa(todas.find((e) => e.id === Number(id)));
  };

  useEffect(() => {
    cargar();
  }, [id]);

  if (!empresa) {
    return <Spinner texto="Cargando empresa..." />;
  }

  const contenido =
    activa === 'configuracion' ? (
      <div className="space-y-6">
        <LogoUploader
          titulo="Logo de la Empresa"
          logoUrl={logoUrl(empresa.logo_url)}
          placeholderLabel={empresa.nombre.charAt(0).toUpperCase()}
          onSubir={(archivo) => empresaService.subirLogo(empresa.id, archivo).then(cargar)}
        />
        {esAdmin && (
          <ConfiguracionComidas empresa={empresa} onActualizado={(actualizada) => setEmpresa(actualizada)} />
        )}
        <UserManagementPanel scope="empresa" empresa={empresa} />
      </div>
    ) : activa === 'funcionarios' ? (
      <FuncionariosPage empresaFija={empresa} />
    ) : activa === 'pedidos' ? (
      <PedidosPage empresaFija={empresa} />
    ) : activa === 'reportes' ? (
      <ReportesPage empresaFija={empresa} />
    ) : activa === 'almuerzos-hoy' ? (
      <SeccionAlmuerzosHoy empresa={empresa} />
    ) : (
      <div className="space-y-6">
        <ConsumoHoyEmpresa empresa={empresa} />
        <ReporteConsumoDiario empresa={empresa} />
      </div>
    );

  return (
    <div className="space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a empresas
      </Link>

      <PageHeader
        icono={Building2}
        titulo={empresa.nombre}
        subtitulo="Gestión de almuerzos y configuración"
      />

      <main>{contenido}</main>
    </div>
  );
}
