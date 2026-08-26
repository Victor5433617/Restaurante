import { useState } from 'react';
import { BarChart3, Printer } from 'lucide-react';
import * as empresaService from '../services/empresaService';
import * as pedidoService from '../services/pedidoService';
import Card from './ui/Card';
import Button from './ui/Button';
import Alert from './ui/Alert';
import ModalVistaPreviaPdf from './ui/ModalVistaPreviaPdf';

const fechaISO = (valor) => {
  const texto = String(valor);
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

const hoyISO = () => fechaISO(new Date());

export default function ConsumoHoyEmpresa({ empresa }) {
  const [consumo, setConsumo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [vistaPreviaPdf, setVistaPreviaPdf] = useState(null);

  const imprimirPdf = async () => {
    setError('');
    setGenerandoPdf(true);
    try {
      const hoy = hoyISO();
      const resultado = await pedidoService.generarReportePdf(empresa.id, hoy, hoy);
      setVistaPreviaPdf(resultado);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo generar el PDF.');
    } finally {
      setGenerandoPdf(false);
    }
  };

  const listarConsumo = async () => {
    setCargando(true);
    setError('');
    try {
      const [conteos, pedidos] = await Promise.all([
        empresaService.conteoHoy(),
        pedidoService.listarPedidos(),
      ]);
      const hoy = hoyISO();
      const conteo = conteos.find((c) => c.empresa_id === empresa.id);
      const pedidoHoy = pedidos.find(
        (p) => p.empresa_id === empresa.id && fechaISO(p.fecha) === hoy
      );
      setConsumo({
        total: Number(conteo?.total_pedidos ?? 0),
        pedidoHoy,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo calcular el consumo de hoy.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Card
      titulo="Consumo Total de Hoy"
      subtitulo="Almuerzos registrados en el día"
      icono={BarChart3}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={listarConsumo} cargando={cargando}>
            <BarChart3 className="w-4 h-4" />
            Listar consumo de hoy
          </Button>
          {consumo && (
            <Button variante="secundario" onClick={imprimirPdf} cargando={generandoPdf}>
              <Printer className="w-4 h-4" />
              Descargar PDF
            </Button>
          )}
        </div>

        {error && (
          <Alert tipo="error" className="mb-4">
            {error}
          </Alert>
        )}

        {consumo && !error && (
          <div className="rounded-xl bg-brand-50 ring-1 ring-brand-100 p-5 flex flex-wrap items-center gap-x-8 gap-y-4">
            <div>
              <p className="font-display text-4xl font-semibold text-brand-700 leading-none">
                {consumo.total}
              </p>
              <p className="text-sm text-stone-600 mt-1.5">
                {consumo.total === 1 ? 'almuerzo consumido hoy' : 'almuerzos consumidos hoy'}
              </p>
            </div>
            <div className="h-10 w-px bg-brand-200 hidden sm:block" />
            <div className="text-sm">
              <p className="text-stone-500 mb-1">Pedido del día</p>
              {consumo.pedidoHoy ? (
                <span className="font-medium text-stone-700">#{consumo.pedidoHoy.id}</span>
              ) : (
                <span className="text-stone-500 italic">Sin pedido registrado</span>
              )}
            </div>
          </div>
        )}

      </div>

      {vistaPreviaPdf && (
        <ModalVistaPreviaPdf
          url={vistaPreviaPdf.url}
          nombreArchivo={vistaPreviaPdf.nombreArchivo}
          onCerrar={() => {
            window.URL.revokeObjectURL(vistaPreviaPdf.url);
            setVistaPreviaPdf(null);
          }}
        />
      )}
    </Card>
  );
}
