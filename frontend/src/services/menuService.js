import api from './api';

export const listarMenu = () => api.get('/menu').then((r) => r.data.data);
export const menuHoy = () => api.get('/menu/hoy').then((r) => r.data.data);
export const crearMenu = (platos) => api.post('/menu', platos).then((r) => r.data.data);
