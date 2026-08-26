# Sistema de Gestión de Almuerzos Corporativos

Sistema para comedores que gestionan el almuerzo diario de varias empresas: carga del menú semanal, anotación de pedidos por funcionario (incluido un modo kiosco), y paneles de administración y reportes en PDF.

## Stack

- **Backend**: Node.js, Express, PostgreSQL (`pg`), JWT, bcrypt, Multer, Puppeteer (PDF)
- **Frontend**: React (Vite), Tailwind CSS v4, React Router

## Roles

- **admin**: gestiona todas las empresas, menú semanal, usuarios administradores y configuración general (logo del comedor).
- **encargada**: gestiona su propia empresa (funcionarios, pedidos, reportes, usuarios de esa empresa).
- **funcionario**: acceso restringido a una única pantalla (kiosco) para anotar su almuerzo del día.

## Estructura

```
backend/    API REST (Express + PostgreSQL)
frontend/   SPA (React + Vite + Tailwind)
```

## Backend — Setup

```bash
cd backend
npm install
```

Crear un archivo `.env` en `backend/` con:

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=restaurante
JWT_SECRET=una_clave_secreta
```

Crear la base de datos y ejecutar el schema:

```bash
psql -U postgres -c "CREATE DATABASE restaurante;"
psql -U postgres -d restaurante -f src/config/schema.sql
```

Levantar el servidor:

```bash
npm run dev     # con nodemon
npm start       # sin nodemon
```

## Frontend — Setup

```bash
cd frontend
npm install
npm run dev       # servidor de desarrollo
npm run build     # build de producción
```

El frontend espera la API en `http://localhost:3000` (ver `frontend/src/services/api.js`).

## Progreso

El detalle de las fases del proyecto y las decisiones técnicas tomadas en cada paso está en [`PROGRESS.md`](./PROGRESS.md).
