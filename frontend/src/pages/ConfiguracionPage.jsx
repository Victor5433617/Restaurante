import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import * as empresaService from '../services/empresaService';
import PageHeader from '../components/ui/PageHeader';
import Alert from '../components/ui/Alert';
import Spinner from '../components/ui/Spinner';
import LogoUploader from '../components/LogoUploader';
import UserManagementPanel from '../components/UserManagementPanel';
import { logoUrl } from '../utils/urls';

export default function ConfiguracionPage() {
  const [empresa, setEmpresa] = useState(null);
  const [error, setError] = useState('');

  const cargar = async () => {
    try {
      const propias = await empresaService.listarEmpresas();
      setEmpresa(propias[0] ?? null);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar tu empresa.');
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        icono={Settings}
        titulo="Configuración"
        subtitulo="Logo, usuarios y accesos de tu empresa."
      />

      {error ? (
        <Alert tipo="error">{error}</Alert>
      ) : !empresa ? (
        <Spinner texto="Cargando configuración..." />
      ) : (
        <div className="space-y-6 max-w-4xl">
          <LogoUploader
            titulo="Logo de la Empresa"
            logoUrl={logoUrl(empresa.logo_url)}
            placeholderLabel={empresa.nombre.charAt(0).toUpperCase()}
            onSubir={(archivo) => empresaService.subirLogo(empresa.id, archivo).then(cargar)}
          />
          <UserManagementPanel scope="empresa" empresa={empresa} />
        </div>
      )}
    </div>
  );
}
