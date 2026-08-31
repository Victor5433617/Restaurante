import { useCallback, useEffect, useState } from 'react';
import { Users, ShieldCheck, UserPlus, KeyRound } from 'lucide-react';
import * as authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import Card from './ui/Card';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';
import Alert from './ui/Alert';
import Badge from './ui/Badge';
import Spinner from './ui/Spinner';
import EmptyState from './ui/EmptyState';
import Modal from './ui/Modal';

const ETIQUETAS_ROL = {
  admin: 'Administrador',
  encargada: 'Encargada',
  funcionario: 'Funcionario',
};

export default function UserManagementPanel({ scope = 'empresa', empresa }) {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const esEmpresa = scope === 'empresa';

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [modalCrear, setModalCrear] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', password: '', rol: esEmpresa ? 'encargada' : 'admin' });
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState('');

  const [modalPassword, setModalPassword] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [actualizando, setActualizando] = useState(false);
  const [errorPassword, setErrorPassword] = useState('');

  const opcionesRol = esEmpresa
    ? esAdmin
      ? [
          { valor: 'encargada', etiqueta: 'Encargada' },
          { valor: 'funcionario', etiqueta: 'Funcionario (kiosco)' },
          { valor: 'admin', etiqueta: 'Administrador' },
        ]
      : [
          { valor: 'encargada', etiqueta: 'Encargada' },
          { valor: 'funcionario', etiqueta: 'Funcionario (kiosco)' },
        ]
    : [];

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const params = esEmpresa ? empresa.id : undefined;
      const lista = await authService.listarUsuarios(params);
      setUsuarios(esEmpresa ? lista : lista.filter((u) => u.rol === 'admin'));
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los usuarios.');
    } finally {
      setCargando(false);
    }
  }, [esEmpresa, empresa]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const abrirModalCrear = () => {
    setNuevoUsuario({ email: '', password: '', rol: esEmpresa ? 'encargada' : 'admin' });
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
        rol: esEmpresa ? nuevoUsuario.rol : 'admin',
        ...(esEmpresa && empresa ? { empresa_id: empresa.id } : {}),
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
        ...(esEmpresa && empresa ? { empresa_id: empresa.id } : {}),
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

  const Icono = esEmpresa ? Users : ShieldCheck;

  return (
    <Card
      titulo={esEmpresa ? 'Usuarios de la Empresa' : 'Administradores del sistema'}
      subtitulo={esEmpresa ? `Accesos vinculados a ${empresa?.nombre}` : 'Cuentas con acceso a todas las empresas'}
      icono={Icono}
      acciones={
        <Button tamanio="sm" onClick={abrirModalCrear}>
          <UserPlus className="w-4 h-4" />
          {esEmpresa ? 'Crear usuario' : 'Crear administrador'}
        </Button>
      }
    >
      {error && <Alert tipo="error">{error}</Alert>}

      {cargando ? (
        <Spinner texto={esEmpresa ? 'Cargando usuarios...' : 'Cargando administradores...'} />
      ) : usuarios.length === 0 ? (
        <EmptyState mensaje={esEmpresa ? 'Todavía no hay usuarios creados para esta empresa.' : 'Todavía no hay administradores creados.'} />
      ) : (
        <div className="overflow-x-auto -m-2 p-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-200">
                <th className="py-2.5 pr-4 font-medium">Email</th>
                {esEmpresa && <th className="py-2.5 pr-4 font-medium">Rol</th>}
                <th className="py-2.5 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition">
                  <td className="py-2.5 pr-4 font-medium text-stone-800">{u.email}</td>
                  {esEmpresa && (
                    <td className="py-2.5 pr-4">
                      <Badge color={u.rol === 'admin' ? 'ambar' : 'brand'}>
                        {ETIQUETAS_ROL[u.rol] || u.rol}
                      </Badge>
                    </td>
                  )}
                  <td className="py-2.5 text-right">
                    {(esAdmin || u.rol !== 'admin') && (
                      <Button variante="fantasma" tamanio="sm" onClick={() => abrirModalPassword(u)}>
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

      <Modal abierto={modalCrear} onCerrar={() => setModalCrear(false)} titulo={esEmpresa ? 'Crear usuario' : 'Crear administrador'}>
        <form onSubmit={crearUsuario} className="space-y-4">
          <Input
            id="usuario-email"
            label="Email"
            type="email"
            required
            placeholder={esEmpresa ? 'encargado@empresa.com' : 'admin@comedor.com'}
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
          {esEmpresa && (
            <Select
              id="usuario-rol"
              label="Rol"
              value={nuevoUsuario.rol}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}
              opciones={opcionesRol}
            />
          )}
          {errorCrear && <Alert tipo="error">{errorCrear}</Alert>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variante="secundario" tamanio="sm" type="button" onClick={() => setModalCrear(false)}>
              Cancelar
            </Button>
            <Button type="submit" tamanio="sm" cargando={creando}>
              {esEmpresa ? 'Crear usuario' : 'Crear administrador'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal abierto={!!modalPassword} onCerrar={() => setModalPassword(null)} titulo="Cambiar contraseña">
        <p className="text-sm text-stone-500">
          Usuario: <span className="font-medium text-stone-700">{modalPassword?.email}</span>
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
      </Modal>
    </Card>
  );
}
