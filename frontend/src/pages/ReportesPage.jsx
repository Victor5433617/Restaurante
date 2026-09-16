import { useEffect, useMemo, useState } from 'react';
import { FileDown, Sheet } from 'lucide-react';
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
import { fechaISO, formatoCorto, lunesDe, sumarDias, rangoFechas } from '../utils/fechas';
import { descargarCsv } from '../utils/csv';

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
  const [tipoReporte, setTipoReporte] = useState('detallado');
  const [tipoComida, setTipoComida] = useState('almuerzo');
  const [resumenComidas, setResumenComidas] = useState([]);
  const [cargandoResumenComidas, setCargandoResumenComidas] = useState(false);

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

  useEffect(() => {
    if (!filtroEmpresa || !desde || !hasta) {
      setResumenComidas([]);
      return;
    }
    let vigente = true;
    setCargandoResumenComidas(true);
    pedidoService
      .obtenerResumenComidas(filtroEmpresa, desde, hasta)
      .then((filas) => {
        if (vigente) setResumenComidas(filas);
      })
      .catch(() => {
        if (vigente) setResumenComidas([]);
      })
      .finally(() => {
        if (vigente) setCargandoResumenComidas(false);
      });
    return () => {
      vigente = false;
    };
  }, [filtroEmpresa, desde, hasta]);

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

  const empresaSeleccionada = empresas.find((e) => e.id === Number(filtroEmpresa));
  const COMIDAS = [
    { tipo: 'desayuno', campo: 'habilita_desayuno', etiqueta: 'Desayuno' },
    { tipo: 'almuerzo', campo: 'habilita_almuerzo', etiqueta: 'Almuerzo' },
    { tipo: 'merienda', campo: 'habilita_merienda', etiqueta: 'Merienda' },
    { tipo: 'cena', campo: 'habilita_cena', etiqueta: 'Cena' },
  ];
  const comidasHabilitadas = empresaSeleccionada
    ? COMIDAS.filter((c) => empresaSeleccionada[c.campo])
    : COMIDAS.filter((c) => c.tipo === 'almuerzo');

  useEffect(() => {
    if (comidasHabilitadas.length === 0) return;
    if (!comidasHabilitadas.some((c) => c.tipo === tipoComida)) {
      setTipoComida(comidasHabilitadas[0].tipo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEmpresa, empresaSeleccionada]);

  const tablaComidas = useMemo(() => {
    if (comidasHabilitadas.length <= 1) return null;
    const mapa = {};
    resumenComidas.forEach((r) => {
      const f = fechaISO(r.fecha);
      if (!mapa[f]) mapa[f] = {};
      mapa[f][r.tipo_comida] = r.cantidad;
    });
    const totales = {};
    comidasHabilitadas.forEach((c) => { totales[c.tipo] = 0; });
    const filasTabla = rangoFechas(desde, hasta).map((f) => {
      const datos = mapa[f] || {};
      const valores = comidasHabilitadas.map((c) => {
        const cantidad = datos[c.tipo] || 0;
        totales[c.tipo] += cantidad;
        return cantidad;
      });
      return { fecha: f, valores };
    });
    return { filasTabla, totales };
  }, [comidasHabilitadas, resumenComidas, desde, hasta]);

  const exportarCsvPrincipal = () => {
    const encabezados = [
      'Fecha',
      ...(!empresaFija ? ['Empresa'] : []),
      'Funcionarios',
      'Almuerzos',
    ];
    const filasCsv = filas.map((f) => [
      formatoCorto(f.fecha),
      ...(!empresaFija ? [nombreEmpresa(f.empresa_id)] : []),
      conteoFuncionarios[f.empresa_id] ?? 0,
      f.almuerzos,
    ]);
    filasCsv.push(['TOTAL', ...(!empresaFija ? [''] : []), '', totalAlmuerzos]);
    descargarCsv(`reporte-${desde}-a-${hasta}.csv`, encabezados, filasCsv);
  };

  const exportarCsvComidas = () => {
    if (!tablaComidas) return;
    const encabezados = ['Fecha', ...comidasHabilitadas.map((c) => c.etiqueta)];
    const filasCsv = tablaComidas.filasTabla.map((f) => [formatoCorto(f.fecha), ...f.valores]);
    filasCsv.push(['TOTAL', ...comidasHabilitadas.map((c) => tablaComidas.totales[c.tipo])]);
    descargarCsv(`resumen-comidas-${desde}-a-${hasta}.csv`, encabezados, filasCsv);
  };

  const generarPdf = async () => {
    setErrorPdf('');
    if (!filtroEmpresa) {
      setErrorPdf('Elegí una empresa para generar el PDF (el reporte es por empresa).');
      return;
    }
    setGenerandoPdf(true);
    try {
      const resultado = await pedidoService.generarReportePdf(filtroEmpresa, desde, hasta, tipoReporte, tipoComida);
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
            <Button
              variante="secundario"
              onClick={exportarCsvPrincipal}
              disabled={filas.length === 0}
              className="flex-1"
            >
              <Sheet className="w-4 h-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-stone-100">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-400">Tipo de reporte</span>
          <label className="flex items-center gap-1.5 text-sm text-stone-700 cursor-pointer">
            <input
              type="radio"
              name="tipo-reporte"
              value="detallado"
              checked={tipoReporte === 'detallado'}
              onChange={() => setTipoReporte('detallado')}
              className="accent-brand-600"
            />
            Detallado (por funcionario)
          </label>
          <label className="flex items-center gap-1.5 text-sm text-stone-700 cursor-pointer">
            <input
              type="radio"
              name="tipo-reporte"
              value="resumen"
              checked={tipoReporte === 'resumen'}
              onChange={() => setTipoReporte('resumen')}
              className="accent-brand-600"
            />
            Resumen (todo junto)
          </label>
        </div>

        {tipoReporte === 'detallado' && comidasHabilitadas.length > 1 && (
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-stone-100">
            <span className="text-xs font-medium uppercase tracking-wide text-stone-400">Comida</span>
            {comidasHabilitadas.map((c) => (
              <label key={c.tipo} className="flex items-center gap-1.5 text-sm text-stone-700 cursor-pointer">
                <input
                  type="radio"
                  name="tipo-comida"
                  value={c.tipo}
                  checked={tipoComida === c.tipo}
                  onChange={() => setTipoComida(c.tipo)}
                  className="accent-brand-600"
                />
                {c.etiqueta}
              </label>
            ))}
          </div>
        )}
        {errorPdf && (
          <Alert tipo="error" className="mt-3">
            {errorPdf}
          </Alert>
        )}
      </Card>

      {tablaComidas && (
        <Card
          titulo="Resumen por comida"
          subtitulo={`${empresaSeleccionada?.nombre ?? ''} — ${formatoCorto(desde)} al ${formatoCorto(hasta)}`}
          acciones={
            <Button variante="secundario" tamanio="sm" onClick={exportarCsvComidas}>
              <Sheet className="w-4 h-4" />
              Exportar CSV
            </Button>
          }
        >
          {cargandoResumenComidas ? (
            <Spinner texto="Cargando resumen..." />
          ) : (
            <div className="overflow-x-auto -m-2 p-2">
              <table className="w-full text-sm min-w-[420px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-200">
                    <th className="py-2.5 pr-4 font-medium">Fecha</th>
                    {comidasHabilitadas.map((c) => (
                      <th key={c.tipo} className="py-2.5 pr-4 font-medium text-right">{c.etiqueta}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tablaComidas.filasTabla.map((f) => (
                    <tr key={f.fecha} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition">
                      <td className="py-2.5 pr-4 text-stone-700 tabular-nums">{formatoCorto(f.fecha)}</td>
                      {f.valores.map((valor, i) => (
                        <td key={comidasHabilitadas[i].tipo} className="py-2.5 pr-4 text-right tabular-nums text-stone-600">
                          {valor > 0 ? valor : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-stone-200">
                    <td className="py-3 pr-4 font-semibold text-stone-700">TOTAL</td>
                    {comidasHabilitadas.map((c) => (
                      <td key={c.tipo} className="py-3 pr-4 text-right font-bold text-brand-700 tabular-nums">
                        {tablaComidas.totales[c.tipo]}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      )}

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
