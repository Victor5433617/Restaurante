import { useEffect, useState } from 'react';
import { Users, Pencil, Trash2, Plus, Inbox } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as funcionarioService from '../services/funcionarioService';
import * as empresaService from '../services/empresaService';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';

const clasesSelect =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 transition focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200';

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

  const eliminar = async (f) => {
    if (!window.confirm(`¿Dar de baja a ${f.nombre_completo}? Dejará de aparecer para anotar pedidos nuevos, pero su historial se conserva.`)) return;
    try {
      await funcionarioService.eliminarFuncionario(f.id);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo dar de baja');
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
          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            className={`${clasesSelect} sm:max-w-xs`}
          >
            <option value="">Todas las empresas</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
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
          <div className="flex flex-col items-center gap-2 py-12 text-stone-400">
            <Inbox className="w-8 h-8" />
            <p className="text-sm">No se encontraron funcionarios.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-200 bg-cream-50">
                  <th className="py-3 pl-5 pr-4 font-medium">Funcionario</th>
                  {!empresaFija && <th className="py-3 pr-4 font-medium">Empresa</th>}
                  <th className="py-3 pr-5 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((f) => (
                  <tr key={f.id} className="border-b border-stone-100 last:border-0">
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
                          title="Editar"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-brand-700 hover:bg-brand-50 transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => eliminar(f)}
                          title="Dar de baja"
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

      {modal && (
        <div className="fixed inset-0 z-50 bg-espresso-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={guardar}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
          >
            <h2 className="text-xl font-bold text-stone-900">
              {modal.modo === 'crear' ? 'Nuevo Funcionario' : 'Editar Funcionario'}
            </h2>
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
              <div>
                <label htmlFor="func-empresa" className="block text-sm font-medium text-stone-600 mb-1.5">
                  Empresa
                </label>
                <select
                  id="func-empresa"
                  value={empresaId}
                  onChange={(e) => setEmpresaId(e.target.value)}
                  required
                  disabled={!esAdmin}
                  className={`${clasesSelect} disabled:bg-stone-50 disabled:text-stone-500`}
                >
                  <option value="">Elegir empresa...</option>
                  {(esAdmin
                    ? empresas
                    : empresas.filter((e) => e.id === usuario?.empresa_id)
                  ).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variante="secundario" type="button" onClick={() => setModal(null)}>
                Cancelar
              </Button>
              <Button type="submit">{modal.modo === 'crear' ? 'Crear' : 'Guardar'}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
