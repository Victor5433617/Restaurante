import { useEffect, useState } from 'react';
import { Users, Pencil, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as funcionarioService from '../services/funcionarioService';
import * as empresaService from '../services/empresaService';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import ConfirmacionDialog from '../components/ui/ConfirmacionDialog';

export default function FuncionariosPage({ empresaFija }) {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const [funcionarios, setFuncionarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEmpresa, setFiltroEmpresa] = useState(
    empresaFija ? String(empresaFija.id) : esAdmin ? '' : String(usuario?.empresa_id ?? '')
  );
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null);
  const [nombre, setNombre] = useState('');
  const [empresaId, setEmpresaId] = useState('');
  const [error, setError] = useState('');
  const [funcionarioEliminar, setFuncionarioEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const opcionesEmpresaFiltro = empresas.map((e) => ({ valor: String(e.id), etiqueta: e.nombre }));
  const opcionesEmpresaForm = (esAdmin ? empresas : empresas.filter((e) => e.id === usuario?.empresa_id)).map((e) => ({
    valor: String(e.id),
    etiqueta: e.nombre,
  }));

  const cargar = async () => {
    setCargando(true);
    try {
      const [listaFun, listaEmp] = await Promise.all([
        funcionarioService.listarFuncionarios(),
        empresaService.listarEmpresas(),
      ]);
      setFuncionarios(listaFun);
      setEmpresas(listaEmp);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const nombreEmpresa = (id) => empresas.find((e) => e.id === id)?.nombre || `Empresa #${id}`;

  const filtrados = funcionarios
    .filter((f) => !filtroEmpresa || f.empresa_id === Number(filtroEmpresa))
    .filter((f) => f.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()));

  const abrirCrear = () => {
    setModal({ modo: 'crear' });
    setNombre('');
    setEmpresaId(empresaFija ? String(empresaFija.id) : esAdmin ? '' : String(usuario?.empresa_id ?? ''));
    setError('');
  };

  const abrirEditar = (f) => {
    setModal({ modo: 'editar', original: f });
    setNombre(f.nombre_completo);
    setEmpresaId(String(f.empresa_id));
    setError('');
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (modal.modo === 'crear') {
        await funcionarioService.crearFuncionario({
          nombre_completo: nombre,
          empresa_id: Number(empresaId),
        });
      } else {
        await funcionarioService.editarFuncionario(modal.original.id, {
          nombre_completo: nombre,
          empresa_id: Number(empresaId),
        });
      }
      setModal(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el funcionario');
    }
  };

  const confirmarEliminar = (f) => {
    setFuncionarioEliminar(f);
  };

  const eliminar = async () => {
    if (!funcionarioEliminar) return;
    setEliminando(true);
    try {
      await funcionarioService.eliminarFuncionario(funcionarioEliminar.id);
      setFuncionarioEliminar(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo dar de baja');
      setFuncionarioEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  if (cargando) {
    return <Spinner texto="Cargando funcionarios..." className="py-24" />;
  }

  return (
    <div className="space-y-6">
      {empresaFija ? (
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-stone-800">Funcionarios</h2>
          <Button onClick={abrirCrear}>
            <Plus className="w-4 h-4" />
            Nuevo funcionario
          </Button>
        </div>
      ) : (
        <PageHeader
          icono={Users}
          titulo="Funcionarios"
          subtitulo="Gestión del personal de cada empresa."
          acciones={
            <Button onClick={abrirCrear}>
              <Plus className="w-4 h-4" />
              Nuevo funcionario
            </Button>
          }
        />
      )}

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        {esAdmin && !empresaFija && (
          <Select
            id="filtro-empresa"
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            opciones={[{ valor: '', etiqueta: 'Todas las empresas' }, ...opcionesEmpresaFiltro]}
            className="sm:max-w-xs"
          />
        )}
        <Input
          id="buscar"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="sm:max-w-xs"
        />
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {filtrados.length === 0 ? (
          <EmptyState mensaje="No se encontraron funcionarios." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-200">
                  <th className="py-3 pl-5 pr-4 font-medium">Funcionario</th>
                  {!empresaFija && <th className="py-3 pr-4 font-medium">Empresa</th>}
                  <th className="py-3 pr-5 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((f) => (
                  <tr key={f.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition">
                    <td className="py-3 pl-5 pr-4">
                      <span className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-brand-50 ring-1 ring-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center uppercase shrink-0">
                          {f.nombre_completo.charAt(0)}
                        </span>
                        <span className="font-medium text-stone-800">{f.nombre_completo}</span>
                      </span>
                    </td>
                    {!empresaFija && (
                      <td className="py-3 pr-4 text-stone-600">{nombreEmpresa(f.empresa_id)}</td>
                    )}
                    <td className="py-3 pr-5">
                      <span className="flex justify-end gap-1">
                        <button
                          onClick={() => abrirEditar(f)}
                          aria-label="Editar"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-brand-700 hover:bg-brand-50 transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmarEliminar(f)}
                          aria-label="Dar de baja"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal abierto={!!modal} onCerrar={() => setModal(null)} titulo={modal?.modo === 'crear' ? 'Nuevo Funcionario' : 'Editar Funcionario'} tamanio="sm">
        <form onSubmit={guardar} className="space-y-4">
          {error && <Alert tipo="error">{error}</Alert>}
          <Input
            id="func-nombre"
            label="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Nombre y apellido"
          />
          {!empresaFija && (
            <Select
              id="func-empresa"
              label="Empresa"
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              opciones={opcionesEmpresaForm}
              placeholder="Elegir empresa..."
              required
              disabled={!esAdmin}
              className="disabled:bg-stone-50 disabled:text-stone-500"
            />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variante="secundario" type="button" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button type="submit">{modal?.modo === 'crear' ? 'Crear' : 'Guardar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmacionDialog
        abierto={!!funcionarioEliminar}
        onCerrar={() => setFuncionarioEliminar(null)}
        onConfirmar={eliminar}
        titulo="Dar de baja funcionario"
        mensaje={`¿Dar de baja a ${funcionarioEliminar?.nombre_completo}? Dejará de aparecer para anotar pedidos nuevos, pero su historial se conserva.`}
        textoConfirmar="Dar de baja"
        cargando={eliminando}
      />
    </div>
  );
}
