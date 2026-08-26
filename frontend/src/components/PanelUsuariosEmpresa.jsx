import { useCallback, useEffect, useState } from 'react';
import { Users, UserPlus, KeyRound, X, Inbox } from 'lucide-react';
import * as authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Alert from './ui/Alert';
import Badge from './ui/Badge';
import Spinner from './ui/Spinner';

const clasesSelect =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 transition focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200';

const ETIQUETAS_ROL = {
  admin: 'Administrador',
  encargada: 'Encargada',
  funcionario: 'Funcionario',
};

export default function PanelUsuariosEmpresa({ empresa }) {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [modalCrear, setModalCrear] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', password: '', rol: 'encargada' });
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState('');

  const [modalPassword, setModalPassword] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [actualizando, setActualizando] = useState(false);
  const [errorPassword, setErrorPassword] = useState('');

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const lista = await authService.listarUsuarios(empresa.id);
      setUsuarios(lista);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los usuarios.');
    } finally {
      setCargando(false);
    }
  }, [empresa.id]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const abrirModalCrear = () => {
    setNuevoUsuario({ email: '', password: '', rol: 'encargada' });
    setErrorCrear('');
    setModalCrear(true);
  };

  const crearUsuario = async (e) => {
    e.preventDefault();
    setErrorCrear('');
    setCreando(true);
    try {
      await authService.registro({
        email: nuevoUsuario.email.trim(),
        password: nuevoUsuario.password,
        rol: nuevoUsuario.rol,
        empresa_id: empresa.id,
      });
      setModalCrear(false);
      cargarUsuarios();
    } catch (err) {
      setErrorCrear(err.response?.data?.error || 'No se pudo crear el usuario.');
    } finally {
      setCreando(false);
    }
  };

  const abrirModalPassword = (u) => {
    setModalPassword(u);
    setNuevaPassword('');
    setConfirmarPassword('');
    setErrorPassword('');
  };

  const actualizarPassword = async (e) => {
    e.preventDefault();
    setErrorPassword('');
    if (nuevaPassword !== confirmarPassword) {
      setErrorPassword('Las contraseñas no coinciden.');
      return;
    }
    setActualizando(true);
    try {
      await authService.actualizarPasswordUsuario({
        empresa_id: empresa.id,
        email: modalPassword.email,
        nueva_password: nuevaPassword,
      });
      setModalPassword(null);
    } catch (err) {
      setErrorPassword(err.response?.data?.error || 'No se pudo actualizar la contraseña.');
    } finally {
      setActualizando(false);
    }
  };

  return (
    <Card
      titulo="Usuarios de la Empresa"
      subtitulo={`Accesos vinculados a ${empresa.nombre}`}
      icono={Users}
      acciones={
        <Button tamanio="sm" onClick={abrirModalCrear}>
          <UserPlus className="w-4 h-4" />
          Crear usuario
        </Button>
      }
    >
      {error && <Alert tipo="error">{error}</Alert>}

      {cargando ? (
        <Spinner texto="Cargando usuarios..." />
      ) : usuarios.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-stone-400">
          <Inbox className="w-8 h-8" />
          <p className="text-sm">Todavía no hay usuarios creados para esta empresa.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -m-2 p-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-200">
                <th className="py-2.5 pr-4 font-medium">Email</th>
                <th className="py-2.5 pr-4 font-medium">Rol</th>
                <th className="py-2.5 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-stone-100 last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-stone-800">{u.email}</td>
                  <td className="py-2.5 pr-4">
                    <Badge color={u.rol === 'admin' ? 'ambar' : 'brand'}>
                      {ETIQUETAS_ROL[u.rol] || u.rol}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-right">
                    {(esAdmin || u.rol !== 'admin') && (
                      <Button
                        variante="fantasma"
                        tamanio="sm"
                        onClick={() => abrirModalPassword(u)}
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Cambiar contraseña
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalCrear && (
        <div className="fixed inset-0 z-50 bg-espresso-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900">Crear usuario</h2>
              <button
                onClick={() => setModalCrear(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={crearUsuario} className="space-y-4">
              <Input
                id="usuario-email"
                label="Email"
                type="email"
                required
                placeholder="encargado@empresa.com"
                value={nuevoUsuario.email}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
              />
              <Input
                id="usuario-password"
                label="Contraseña"
                type="password"
                required
                minLength={4}
                placeholder="Mínimo 4 caracteres"
                value={nuevoUsuario.password}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
              />
              <div>
                <label htmlFor="usuario-rol" className="block text-sm font-medium text-stone-600 mb-1.5">
                  Rol
                </label>
                <select
                  id="usuario-rol"
                  className={clasesSelect}
                  value={nuevoUsuario.rol}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}
                >
                  <option value="encargada">Encargada</option>
                  <option value="funcionario">Funcionario (kiosco)</option>
                  {esAdmin && <option value="admin">Administrador</option>}
                </select>
              </div>
              {errorCrear && <Alert tipo="error">{errorCrear}</Alert>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variante="secundario" tamanio="sm" type="button" onClick={() => setModalCrear(false)}>
                  Cancelar
                </Button>
                <Button type="submit" tamanio="sm" cargando={creando}>
                  Crear usuario
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalPassword && (
        <div className="fixed inset-0 z-50 bg-espresso-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900">Cambiar contraseña</h2>
              <button
                onClick={() => setModalPassword(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <p className="text-sm text-stone-500">
              Usuario: <span className="font-medium text-stone-700">{modalPassword.email}</span>
            </p>
            <form onSubmit={actualizarPassword} className="space-y-4">
              <Input
                id="password-nueva"
                label="Nueva contraseña"
                type="password"
                required
                minLength={4}
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
              />
              <Input
                id="password-confirmar"
                label="Confirmar contraseña"
                type="password"
                required
                minLength={4}
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
              />
              {errorPassword && <Alert tipo="error">{errorPassword}</Alert>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variante="secundario" tamanio="sm" type="button" onClick={() => setModalPassword(null)}>
                  Cancelar
                </Button>
                <Button type="submit" tamanio="sm" cargando={actualizando}>
                  Guardar contraseña
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
