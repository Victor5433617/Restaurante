import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RutaProtegida({ children, rolesPermitidos }) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    const destinos = { funcionario: '/pedido', admin: '/' };
    return <Navigate to={destinos[usuario.rol] || '/dashboard'} replace />;
  }

  return children;
}
