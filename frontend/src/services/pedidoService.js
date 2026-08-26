import api from './api';

export const listarPedidos = () => api.get('/pedidos').then((r) => r.data.data);
export const obtenerDetallePedido = (id) => api.get(`/pedidos/${id}`).then((r) => r.data.data);
export const crearPedidoCompleto = (datos) => api.post('/pedidos/completo', datos).then((r) => r.data.data);
export const anotarFuncionario = (datos) => api.post('/pedidos/anotar', datos).then((r) => r.data.data);
export const quitarFuncionario = (datos) => api.post('/pedidos/quitar', datos).then((r) => r.data.data);
export const obtenerReporte = (empresaId, desde, hasta) =>
  api.get('/pedidos/reporte', { params: { empresa_id: empresaId, desde, hasta } }).then((r) => r.data.data);

export const generarReportePdf = async (empresaId, desde, hasta) => {
  const respuesta = await api.get('/pedidos/reporte/pdf', {
    params: { empresa_id: empresaId, desde, hasta },
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([respuesta.data], { type: 'application/pdf' }));
  return { url, nombreArchivo: `reporte-${desde}-a-${hasta}.pdf` };
};
