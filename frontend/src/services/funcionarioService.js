import api from './api';

export const listarFuncionarios = () => api.get('/funcionarios').then((r) => r.data.data);
export const funcionariosDeEmpresa = (empresaId, todos) =>
  todos.filter((f) => f.empresa_id === Number(empresaId));
export const crearFuncionario = (datos) => api.post('/funcionarios', datos).then((r) => r.data.data);
export const editarFuncionario = (id, datos) => api.put(`/funcionarios/${id}`, datos).then((r) => r.data.data);
export const eliminarFuncionario = (id) => api.delete(`/funcionarios/${id}`).then((r) => r.data);
