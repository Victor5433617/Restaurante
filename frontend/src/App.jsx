import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';
import AppShell from './components/AppShell';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmpresaCardGrid from './components/EmpresaCardGrid';
import EmpresaDetailPage from './pages/EmpresaDetailPage';
import FuncionariosPage from './pages/FuncionariosPage';
import MenuSemanalPage from './pages/MenuSemanalPage';
import PedidosPage from './pages/PedidosPage';
import PedidoDetallePage from './pages/PedidoDetallePage';
import ReportesPage from './pages/ReportesPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import FormularioPedidoDiario from './components/FormularioPedidoDiario';

const Protegido = ({ children, rolesPermitidos }) => {
  const [params] = useSearchParams();
  const { usuario } = useAuth();
  const ocultarShell = params.get('kiosco') === '1' || usuario?.rol === 'funcionario';

  return (
    <RutaProtegida rolesPermitidos={rolesPermitidos}>
      {ocultarShell ? (
        <div className="min-h-screen bg-cream-50">{children}</div>
      ) : (
        <AppShell>{children}</AppShell>
      )}
    </RutaProtegida>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <Protegido rolesPermitidos={['encargada']}>
                <DashboardPage />
              </Protegido>
            }
          />
          <Route
            path="/"
            element={
              <Protegido rolesPermitidos={['admin']}>
                <EmpresaCardGrid />
              </Protegido>
            }
          />
          <Route
            path="/funcionarios"
            element={
              <Protegido rolesPermitidos={['encargada']}>
                <FuncionariosPage />
              </Protegido>
            }
          />
          <Route
            path="/menu"
            element={
              <Protegido rolesPermitidos={['admin']}>
                <MenuSemanalPage />
              </Protegido>
            }
          />
          <Route
            path="/pedidos"
            element={
              <Protegido rolesPermitidos={['encargada']}>
                <PedidosPage />
              </Protegido>
            }
          />
          <Route
            path="/pedidos/:id"
            element={
              <Protegido rolesPermitidos={['admin', 'encargada']}>
                <PedidoDetallePage />
              </Protegido>
            }
          />
          <Route
            path="/reportes"
            element={
              <Protegido rolesPermitidos={['encargada']}>
                <ReportesPage />
              </Protegido>
            }
          />
          <Route
            path="/configuracion"
            element={
              <Protegido rolesPermitidos={['encargada']}>
                <ConfiguracionPage />
              </Protegido>
            }
          />
          <Route
            path="/pedido"
            element={
              <Protegido>
                <FormularioPedidoDiario />
              </Protegido>
            }
          />
          <Route
            path="/empresas/:id"
            element={
              <Protegido rolesPermitidos={['admin', 'encargada']}>
                <EmpresaDetailPage />
              </Protegido>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
