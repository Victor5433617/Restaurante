import { useEffect, useMemo, useState } from 'react';
import { FileDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as pedidoService from '../services/pedidoService';
import * as empresaService from '../services/empresaService';
import * as funcionarioService from '../services/funcionarioService';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import ModalVistaPreviaPdf from '../components/ui/ModalVistaPreviaPdf';
import { fechaISO, formatoCorto, lunesDe, sumarDias } from '../utils/fechas';

export default function ReportesPage({ empresaFija }) {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin' && !empresaFija;
  const [pedidos, setPedidos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [conteoFuncionarios, setConteoFuncionarios] = useState({});
  const [historico, setHistorico] = useState({});
  const [cargandoHistorico, setCargandoHistorico] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const lunes = lunesDe(new Date());
  const [desde, setDesde] = useState(fechaISO(lunes));
  const [hasta, setHasta] = useState(fechaISO(sumarDias(lunes, 4)));
  const [filtroEmpresa, setFiltroEmpresa] = useState(
    empresaFija ? String(empresaFija.id) : esAdmin ? '' : String(usuario?.empresa_id ?? '')
  );
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [errorPdf, setErrorPdf] = useState('');
  const [vistaPreviaPdf, setVistaPreviaPdf] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [listaPedidos, listaEmpresas, funcionarios] = await Promise.all([
          pedidoService.listarPedidos(),
          empresaService.listarEmpresas(),
          funcionarioService.listarFuncionarios(),
        ]);
        setPedidos(listaPedidos);
        setEmpresas(listaEmpresas);
        const porEmpresa = {};
        funcionarios.forEach((f) => {
          porEmpresa[f.empresa_id] = (porEmpresa[f.empresa_id] || 0) + 1;
        });
        setConteoFuncionarios(porEmpresa);
      } catch (err) {
        setError(err.response?.data?.error || 'No se pudo cargar el reporte.');
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (empresas.length === 0 || !desde || !hasta) return;
    const empresasObjetivo = filtroEmpresa ? [Number(filtroEmpresa)] : empresas.map((e) => e.id);
    let vigente = true;
    setCargandoHistorico(true);
    Promise.all(empresasObjetivo.map((id) => pedidoService.obtenerReporte(id, desde, hasta)))
      .then((resultadosPorEmpresa) => {
        if (!vigente) return;
        const mapa = {};
        resultadosPorEmpresa.forEach((filasEmpresa, i) => {
          const empresaId = empresasObjetivo[i];
          filasEmpresa.forEach((fila) => {
            if (fila.estado !== '1') return;
            const clave = `${empresaId}_${fechaISO(fila.fecha)}`;
            mapa[clave] = (mapa[clave] || 0) + 1;
          });
        });
        setHistorico(mapa);
      })
      .catch((err) => {
        if (vigente) setError(err.response?.data?.error || 'No se pudo cargar el histórico de almuerzos.');
      })
      .finally(() => {
        if (vigente) setCargandoHistorico(false);
      });
    return () => {
      vigente = false;
    };
  }, [empresas, filtroEmpresa, desde, hasta]);

  const filas = useMemo(() => {
    return pedidos
      .filter((p) => (!desde || fechaISO(p.fecha) >= desde) && (!hasta || fechaISO(p.fecha) <= hasta))
      .filter((p) => !filtroEmpresa || p.empresa_id === Number(filtroEmpresa))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .map((p) => ({
        ...p,
        almuerzos: historico[`${p.empresa_id}_${fechaISO(p.fecha)}`] ?? 0,
      }));
  }, [pedidos, desde, hasta, filtroEmpresa, historico]);

  const totalAlmuerzos = filas.reduce((acc, f) => acc + f.almuerzos, 0);
  const nombreEmpresa = (id) =>
    empresas.find((e) => e.id === id)?.nombre || `Empresa #${id}`;

  const generarPdf = async () => {
    setErrorPdf('');
    if (!filtroEmpresa) {
      setErrorPdf('Elegí una empresa para generar el PDF (el reporte es por empresa).');
      return;
    }
    setGenerandoPdf(true);
    try {
      const resultado = await pedidoService.generarReportePdf(filtroEmpresa, desde, hasta);
      setVistaPreviaPdf(resultado);
    } catch (err) {
      setErrorPdf(err.response?.data?.error || 'No se pudo generar el PDF.');
    } finally {
      setGenerandoPdf(false);
    }
  };

  if (error) {
    return (
      <Alert tipo="error" className="max-w-xl mx-auto mt-10">
        {error}
      </Alert>
    );
  }

  if (cargando) {
    return <Spinner texto="Generando reporte..." className="py-24" />;
  }

  const opcionesEmpresa = empresas.map((e) => ({ valor: String(e.id), etiqueta: e.nombre }));

  return (
    <div className="space-y-6">
      {empresaFija ? (
        <h2 className="font-display text-lg font-semibold text-stone-800">Reportes</h2>
      ) : (
        <PageHeader
          icono={FileDown}
          titulo="Reporte de consumo"
          subtitulo="Historial de almuerzos por empresa y fecha."
        />
      )}

      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {esAdmin && (
            <Select
              id="rep-empresa"
              label="Empresa"
              value={filtroEmpresa}
              onChange={(e) => setFiltroEmpresa(e.target.value)}
              opciones={[{ valor: '', etiqueta: 'Todas' }, ...opcionesEmpresa]}
            />
          )}
          <Input
            id="rep-desde"
            label="Desde"
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
          <Input
            id="rep-hasta"
            label="Hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
          <div className="flex items-end gap-2">
            <Button
              variante="secundario"
              onClick={generarPdf}
              cargando={generandoPdf}
              className="flex-1"
            >
              <FileDown className="w-4 h-4" />
              Generar PDF
            </Button>
          </div>
        </div>
        {errorPdf && (
          <Alert tipo="error" className="mt-3">
            {errorPdf}
          </Alert>
        )}
      </Card>

      <Card titulo={`${filas.length} ${filas.length === 1 ? 'registro' : 'registros'}`}>
        {filas.length === 0 ? (
          <EmptyState mensaje="No hay pedidos en el período seleccionado." />
        ) : (
          <>
            <div className="overflow-x-auto -m-2 p-2">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-200">
                    <th className="py-2.5 pr-4 font-medium">Fecha</th>
                    {!empresaFija && <th className="py-2.5 pr-4 font-medium">Empresa</th>}
                    <th className="py-2.5 pr-4 font-medium text-right">Funcionarios</th>
                    <th className="py-2.5 font-medium text-right">Almuerzos</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition">
                      <td className="py-3 pr-4 text-stone-700 tabular-nums">
                        {formatoCorto(f.fecha)}
                      </td>
                      {!empresaFija && (
                        <td className="py-3 pr-4 font-medium text-stone-800">
                          {nombreEmpresa(f.empresa_id)}
                        </td>
                      )}
                      <td className="py-3 pr-4 text-stone-600 text-right tabular-nums">
                        {conteoFuncionarios[f.empresa_id] ?? 0}
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        <span className="font-semibold text-brand-700">{f.almuerzos}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-stone-200">
                    <td colSpan={empresaFija ? 2 : 3} className="py-3 pr-4 text-right font-semibold text-stone-700">
                      Total almuerzos en el período
                    </td>
                    <td className="py-3 text-right font-bold text-brand-700 tabular-nums">
                      {totalAlmuerzos}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {cargandoHistorico && (
              <p className="text-xs text-stone-400 mt-3">Actualizando conteo de almuerzos...</p>
            )}
          </>
        )}
      </Card>

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
    </div>
  );
}
