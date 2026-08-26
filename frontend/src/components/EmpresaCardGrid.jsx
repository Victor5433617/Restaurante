import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as empresaService from '../services/empresaService';
import * as funcionarioService from '../services/funcionarioService';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';

export default function EmpresaCardGrid() {
  const [empresas, setEmpresas] = useState([]);
  const [conteoFuncionarios, setConteoFuncionarios] = useState({});
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');
  const [error, setError] = useState('');
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const esAdmin = usuario?.rol === 'admin';

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [listado, funcionarios] = await Promise.all([
        empresaService.listarEmpresas(),
        funcionarioService.listarFuncionarios(),
      ]);
      const conteos = {};
      funcionarios.forEach((f) => {
        conteos[f.empresa_id] = (conteos[f.empresa_id] || 0) + 1;
      });
      setEmpresas(listado);
      setConteoFuncionarios(conteos);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirCrear = () => {
    setEditando(null);
    setNombre('');
    setRuc('');
    setError('');
    setMostrarModal(true);
  };

  const abrirEditar = (empresa) => {
    setMenuAbiertoId(null);
    setEditando(empresa);
    setNombre(empresa.nombre);
    setRuc(empresa.ruc_identificador || '');
    setError('');
    setMostrarModal(true);
  };

  const guardarModal = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editando) {
        await empresaService.editarEmpresa(editando.id, { nombre, ruc_identificador: ruc });
      } else {
        await empresaService.crearEmpresa({ nombre, ruc_identificador: ruc });
      }
      setMostrarModal(false);
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar la empresa');
    }
  };

  const eliminarEmpresa = async (empresa) => {
    setMenuAbiertoId(null);
    if (!window.confirm(`¿Eliminar ${empresa.nombre}? Se borrarán sus funcionarios y pedidos.`)) {
      return;
    }
    try {
      await empresaService.eliminarEmpresa(empresa.id);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo eliminar la empresa');
    }
  };

  if (cargando) {
    return <Spinner texto="Cargando empresas..." className="py-24" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,260px))] gap-4">
        {empresas.map((empresa) => (
          <div
            key={empresa.id}
            onClick={() => esAdmin && navigate(`/empresas/${empresa.id}`)}
            className={`relative aspect-square bg-white rounded-xl border border-stone-200 shadow-sm p-5 flex flex-col items-center justify-center text-center gap-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-brand-200 ${
              esAdmin ? 'cursor-pointer' : ''
            }`}
          >
            {esAdmin && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuAbiertoId(menuAbiertoId === empresa.id ? null : empresa.id);
                  }}
                  title="Opciones"
                  className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuAbiertoId === empresa.id && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAbiertoId(null);
                      }}
                    />
                    <div
                      className="absolute top-11 right-3 z-40 w-36 bg-white rounded-lg border border-stone-200 shadow-lg py-1 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => abrirEditar(empresa)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-stone-700 hover:bg-stone-50 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarEmpresa(empresa)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {empresa.logo_url ? (
              <img
                src={`http://localhost:3000/uploads/logos/${empresa.logo_url}`}
                alt={empresa.nombre}
                className="w-16 h-16 object-contain rounded-full ring-1 ring-stone-200 p-0.5 shrink-0"
              />
            ) : (
              <span className="w-16 h-16 rounded-full bg-brand-50 ring-1 ring-brand-100 flex items-center justify-center shrink-0">
                <span className="text-2xl font-semibold text-brand-600">
                  {empresa.nombre.charAt(0).toUpperCase()}
                </span>
              </span>
            )}
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-stone-800 leading-snug">
                {empresa.nombre}
              </p>
              <p className="text-xs text-stone-500 mt-1 flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {conteoFuncionarios[empresa.id] || 0} funcionarios
              </p>
            </div>
          </div>
        ))}

        {esAdmin && (
          <button
            onClick={abrirCrear}
            className="aspect-square rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center gap-2 text-stone-400 transition hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm font-medium">Nueva empresa</span>
          </button>
        )}
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 z-50 bg-espresso-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={guardarModal}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
          >
            <h2 className="text-xl font-bold text-stone-900">
              {editando ? 'Editar Empresa' : 'Nueva Empresa'}
            </h2>
            {error && <Alert tipo="error">{error}</Alert>}
            <Input
              id="nombre"
              label="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Nombre de la empresa"
            />
            <Input
              id="ruc"
              label="RUC"
              value={ruc}
              onChange={(e) => setRuc(e.target.value)}
              placeholder="RUC / identificador"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variante="secundario" type="button" onClick={() => setMostrarModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editando ? 'Guardar' : 'Crear'}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
