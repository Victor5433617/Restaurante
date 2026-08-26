import api from './api';

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data.data);

export const registro = (datos) =>
  api.post('/auth/registro', datos).then((r) => r.data.data);

export const actualizarPasswordUsuario = (datos) =>
  api.put('/auth/usuarios/contrasena', datos).then((r) => r.data.data);

export const listarUsuarios = (empresaId) =>
  api.get('/auth/usuarios', { params: { empresa_id: empresaId } }).then((r) => r.data.data);
