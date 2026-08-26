--creacion de tablas necesarias 

--tabla empresas
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ruc_identificador VARCHAR(50) UNIQUE,
    logo_url VARCHAR(200),
    estado boolean DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

--tabla funcionarios
CREATE TABLE funcionarios (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre_completo VARCHAR NOT NULL,
    activo boolean DEFAULT true
);
-- tabla menu semanal
CREATE TABLE menu_semanal(
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    opcion_numero INTEGER NOT NULL,
    plato_nombre VARCHAR NOT NULL,
    descripcion TEXT,
    UNIQUE (fecha, opcion_numero)
);
-- tabla pedidos diarios
CREATE TABLE pedidos_diarios(
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    estado VARCHAR(20) CHECK (estado IN ('Borrador', 'Confirmado')) NOT NULL DEFAULT 'Borrador',
    UNIQUE (empresa_id, fecha)
);
-- tabla detalles de pedido
CREATE TABLE detalles_pedidos(
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos_diarios(id) ON DELETE CASCADE,
    funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    menu_semanal_id INTEGER NOT NULL REFERENCES menu_semanal(id) ON DELETE RESTRICT,
    observacion TEXT,
    UNIQUE(pedido_id, funcionario_id)
);


CREATE TABLE usuarios(
   id SERIAL PRIMARY KEY,
   email varchar(100) UNIQUE NOT NULL,
   password_hash VARCHAR(255) NOT NULL,
   rol VARCHAR(20) CHECK (rol IN ('admin', 'encargada', 'funcionario')) NOT NULL DEFAULT 'encargada',
   empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
   created_at TIMESTAMP DEFAULT NOW()
);

-- tabla configuracion (fila única, id = 1, datos globales del comedor)
CREATE TABLE configuracion(
    id SERIAL PRIMARY KEY,
    logo_comedor_url VARCHAR(200)
);

INSERT INTO configuracion (id, logo_comedor_url) VALUES (1, NULL);

