const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const reporteModel = require('../models/reporteModel');
const empresaModel = require('../models/empresaModel');
const configModel = require('../models/configModel');

function logoADataUri(nombreArchivo) {
  if (!nombreArchivo) return null;
  const ruta = path.join(__dirname, '..', '..', 'uploads', 'logos', nombreArchivo);
  if (!fs.existsSync(ruta)) return null;
  const extension = path.extname(ruta).slice(1) || 'png';
  const base64 = fs.readFileSync(ruta).toString('base64');
  return `data:image/${extension};base64,${base64}`;
}

function formatoFecha(iso) {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

function formatoFechaCorta(iso) {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

function construirMatriz(filas) {
  const fechas = [...new Set(filas.map((f) => f.fecha.toISOString().slice(0, 10)))].sort();
  const funcionarios = new Map();
  for (const f of filas) {
    if (!funcionarios.has(f.funcionario_id)) {
      funcionarios.set(f.funcionario_id, { nombre_completo: f.nombre_completo, porFecha: {} });
    }
    funcionarios.get(f.funcionario_id).porFecha[f.fecha.toISOString().slice(0, 10)] = f.estado;
  }
  const listaFuncionarios = [...funcionarios.values()].sort((a, b) =>
    a.nombre_completo.localeCompare(b.nombre_completo)
  );
  return { fechas, listaFuncionarios };
}

const FECHAS_POR_PAGINA = 20;

function partirEnBloques(lista, tamanio) {
  const bloques = [];
  for (let i = 0; i < lista.length; i += tamanio) {
    bloques.push(lista.slice(i, i + tamanio));
  }
  return bloques.length ? bloques : [[]];
}

function construirTabla(fechasBloque, listaFuncionarios) {
  const encabezadoFechas = fechasBloque.map((f) => `<th>${formatoFechaCorta(f)}</th>`).join('');
  const filasHtml = listaFuncionarios
    .map((func) => {
      const celdas = fechasBloque
        .map((f) => {
          const estado = func.porFecha[f] || 'X';
          return `<td class="estado ${estado === '1' ? 'si' : 'no'}">${estado}</td>`;
        })
        .join('');
      return `<tr><td class="nombre">${func.nombre_completo}</td>${celdas}</tr>`;
    })
    .join('');

  return `<table>
      <thead>
        <tr><th>Funcionario</th>${encabezadoFechas}</tr>
      </thead>
      <tbody>${filasHtml}</tbody>
    </table>`;
}

function construirHtml({ empresa, logoComedorUri, logoEmpresaUri, filas, desde, hasta, total }) {
  const { fechas, listaFuncionarios } = construirMatriz(filas);
  const bloquesFechas = partirEnBloques(fechas, FECHAS_POR_PAGINA);
  const unaSolaPagina = bloquesFechas.length <= 1;

  const paginas = !listaFuncionarios.length
    ? '<p>No hay datos en el período seleccionado.</p>'
    : bloquesFechas
        .map((bloque, i) => {
          const subtitulo = unaSolaPagina
            ? ''
            : `<h4>Página ${i + 1} de ${bloquesFechas.length} — ${formatoFecha(bloque[0])} al ${formatoFecha(bloque[bloque.length - 1])}</h4>`;
          const esUltima = i === bloquesFechas.length - 1;
          const claseCorte = esUltima ? '' : ' con-salto';
          return `<section class="pagina-tabla${claseCorte}">${subtitulo}${construirTabla(bloque, listaFuncionarios)}</section>`;
        })
        .join('');

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 32px; ${
        unaSolaPagina ? 'min-height: calc(100vh - 64px); display: flex; flex-direction: column;' : ''
      } }
      header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1f2937; padding-bottom: 16px; margin-bottom: 24px; }
      header img { max-height: 60px; max-width: 140px; object-fit: contain; }
      header .titulo { text-align: center; flex: 1; }
      header h1 { font-size: 18px; margin: 0; }
      header p { font-size: 12px; color: #6b7280; margin: 4px 0 0; }
      .pagina-tabla.con-salto { page-break-after: always; margin-bottom: 16px; }
      .pagina-tabla h4 { font-size: 12px; color: #6b7280; margin: 0 0 8px; }
      ${unaSolaPagina ? '.pagina-tabla { flex: 1; display: flex; flex-direction: column; }' : ''}
      table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; ${
        unaSolaPagina ? 'flex: 1; height: 100%;' : ''
      } }
      th, td { border: 1px solid #d1d5db; padding: 4px 2px; text-align: center; overflow: hidden; text-overflow: ellipsis; }
      th { background: #f9fafb; white-space: nowrap; font-size: 10px; }
      td.nombre, th:first-child { text-align: left; white-space: nowrap; width: 130px; font-size: 11px; }
      .estado { font-weight: bold; }
      .estado.si { color: #15803d; }
      .estado.no { color: #b91c1c; }
      footer { margin-top: 24px; border-top: 2px solid #1f2937; padding-top: 12px; text-align: right; font-size: 13px; font-weight: bold; }
    </style>
  </head>
  <body>
    <header>
      ${logoComedorUri ? `<img src="${logoComedorUri}" alt="Logo comedor" />` : '<div></div>'}
      <div class="titulo">
        <h1>Reporte de Consumo — ${empresa.nombre}</h1>
        <p>${formatoFecha(desde)} al ${formatoFecha(hasta)}</p>
      </div>
      ${logoEmpresaUri ? `<img src="${logoEmpresaUri}" alt="Logo empresa" />` : '<div></div>'}
    </header>

    ${paginas}

    <footer>Total de almuerzos registrados en el período: ${total}</footer>
  </body>
  </html>`;
}

async function generarReportePdf(req, res) {
  let navegador;
  try {
    const { empresa_id: empresaId, desde, hasta } = req.query;
    if (!empresaId || !desde || !hasta) {
      return res.status(400).json({ success: false, error: 'Faltan empresa_id, desde o hasta' });
    }
    if (req.usuario.rol !== 'admin' && Number(empresaId) !== req.usuario.empresa_id) {
      return res.status(403).json({ success: false, error: 'No podés generar el reporte de otra empresa' });
    }

    const empresas = await empresaModel.ObtenerTodos();
    const empresa = empresas.find((e) => e.id === Number(empresaId));
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
    }

    const configuracion = await configModel.obtener();
    const filas = await reporteModel.obtenerReporte(empresaId, desde, hasta);
    const total = filas.filter((f) => f.estado === '1').length;

    const html = construirHtml({
      empresa,
      logoComedorUri: logoADataUri(configuracion?.logo_comedor_url),
      logoEmpresaUri: logoADataUri(empresa.logo_url),
      filas,
      desde,
      hasta,
      total,
    });

    navegador = await puppeteer.launch({ headless: true });
    const pagina = await navegador.newPage();
    await pagina.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await pagina.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '20px', bottom: '20px' },
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-${empresa.nombre}-${desde}-a-${hasta}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (navegador) await navegador.close();
  }
}

module.exports = { generarReportePdf };
