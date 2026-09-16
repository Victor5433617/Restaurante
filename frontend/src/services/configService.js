import api from './api';

export const obtenerConfiguracion = () => api.get('/config').then((r) => r.data.data);
export const obtenerConfiguracionPublica = () => api.get('/config/publico').then((r) => r.data.data);

export const subirLogoComedor = (archivo) => {
  const formData = new FormData();
  formData.append('logo', archivo);
  return api.post('/config/logo-comedor', formData).then((r) => r.data.data);
};
