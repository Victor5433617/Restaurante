import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import * as empresaService from '../services/empresaService';
import PageHeader from '../components/ui/PageHeader';
import Alert from '../components/ui/Alert';
import Spinner from '../components/ui/Spinner';
import ConfiguracionEmpresa from '../components/ConfiguracionEmpresa';
import PanelUsuariosEmpresa from '../components/PanelUsuariosEmpresa';

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
          <ConfiguracionEmpresa empresa={empresa} onActualizado={cargar} />
          <PanelUsuariosEmpresa empresa={empresa} />
        </div>
      )}
    </div>
  );
}
