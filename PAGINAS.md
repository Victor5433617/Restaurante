# Mapa de páginas — Comensa App

Rutas del frontend (`frontend/src/App.jsx`), con el rol requerido para acceder a cada una.

| Ruta | Página | Roles permitidos | Descripción |
|---|---|---|---|
| `/login` | `LoginPage` | público | Inicio de sesión. |
| `/` | `EmpresaCardGrid` | `admin` | Listado de empresas (home del admin). |
| `/dashboard` | `DashboardPage` | `encargada` | Resumen/inicio de una empresa (encargada). |
| `/empresas/:id` | `EmpresaDetailPage` | `admin`, `encargada` | Detalle de una empresa — ver pestañas abajo. |
| `/funcionarios` | `FuncionariosPage` | `encargada` | Listado de funcionarios de su empresa. |
| `/menu` | `MenuSemanalPage` | `admin` | Gestión del menú semanal — ver pestañas abajo. |
| `/pedidos` | `PedidosPage` | `encargada` | Historial de pedidos de su empresa. |
| `/pedidos/:id` | `PedidoDetallePage` | `admin`, `encargada` | Detalle de un pedido puntual (por fecha/empresa), con pestañas de comida (desayuno/almuerzo/merienda/cena) si la empresa las tiene habilitadas. |
| `/pedido` | `FormularioPedidoDiario` | cualquier usuario logueado | Cargar el pedido del día (funcionario anota su propio almuerzo; admin/encargada pueden elegir empresa y fecha). Acepta `?empresa_id=` para preseleccionar empresa y `?kiosco=1` para ocultar el menú lateral (modo kiosco). |
| `/reportes` | `ReportesPage` | `encargada` | Reportes de consumo (PDF detallado/resumen, CSV, resumen por comida en pantalla). |
| `/configuracion` | `ConfiguracionPage` | `encargada` | Logo de la empresa y usuarios vinculados. |

## Pestañas dentro de `/empresas/:id` (admin viendo una empresa puntual)

Controladas por `?tab=` en la URL:

| tab | Contenido |
|---|---|
| `almuerzos-hoy` (default) | `SeccionAlmuerzosHoy` — listado de funcionarios y su pedido de almuerzo del día. |
| `pedidos` | `PedidosPage` con `empresaFija` — historial de pedidos de esa empresa. |
| `funcionarios` | `FuncionariosPage` con `empresaFija`. |
| `consumo` | `ConsumoHoyEmpresa` + `ReporteConsumoDiario` — conteo rápido del día y accesos a reporte/PDF. |
| `reportes` | `ReportesPage` con `empresaFija`. |
| `configuracion` | Logo de la empresa, **Comidas habilitadas** (desayuno/almuerzo/merienda/cena) y usuarios vinculados a esa empresa. |

## Pestañas dentro de `/menu` (solo admin)

| tab | Contenido |
|---|---|
| `usuarios` | Gestión de usuarios administradores globales. |
| `cargar` | Cargar menú semanal (opciones de almuerzo por día). |
| `historial` | Historial de menús cargados, filtrable por rango de fechas. |
| `configuracion` | Logo del comedor (aparece en el encabezado de los PDF). |

## Navegación (`AppShell.jsx`)

- **Admin fuera de una empresa**: barra horizontal arriba con "Empresas" y "Menú semanal".
- **Admin dentro de una empresa** (`/empresas/:id`): sidebar con las pestañas de esa empresa (tabla de arriba) + "Volver a Empresas".
- **Encargada**: sidebar fijo con Dashboard, Funcionarios, Pedidos diarios, Reportes, Configuración.
- **Funcionario**: sin sidebar, va directo a `/pedido` (modo simplificado, sin selector de empresa ni fecha).

## Backend — organización de rutas (`backend/src/routes/`)

| Archivo | Prefijo | Qué expone |
|---|---|---|
| `authRoutes.js` | `/api/auth` | login, registro de usuarios, listar usuarios, cambiar contraseña. |
| `empresaRoutes.js` | `/api/empresas` | CRUD de empresas, logo, comidas habilitadas, conteo del día. |
| `funcionarioRoutes.js` | `/api/funcionarios` | CRUD de funcionarios. |
| `menuRoutes.js` | `/api/menu` | menú semanal (listar, crear, editar, menú de hoy, menú por fecha). |
| `pedidoRoutes.js` | `/api/pedidos` | pedidos diarios, anotar/quitar funcionario, reportes (JSON, PDF, resumen por comida). |
| `configRoutes.js` | `/api/config` | configuración general del comedor (logo), y `/publico` sin login (para login page/favicon). |

Health check: `GET /health` (sin autenticación, usado para mantener despierta la instancia free de Render).
