import api from './api';

export const listarEmpresas = () => api.get('/empresas').then((r) => r.data.data);
export const conteoHoy = () => api.get('/empresas/conteo-hoy').then((r) => r.data.data);
export const obtenerEmpresa = (id, empresas) => empresas.find((e) => e.id === Number(id));
export const crearEmpresa = (datos) => api.post('/empresas', datos).then((r) => r.data.data);
export const editarEmpresa = (id, datos) => api.put(`/empresas/${id}`, datos).then((r) => r.data.data);
export const eliminarEmpresa = (id) => api.delete(`/empresas/${id}`).then((r) => r.data);
export const subirLogo = (id, file) => {
  const formData = new FormData();
  formData.append('logo', file);
  return api.post(`/empresas/${id}/logo`, formData).then((r) => r.data.data);
};
