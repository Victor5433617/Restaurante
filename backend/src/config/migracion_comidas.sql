-- Migración: soporte para desayuno, almuerzo, merienda y cena
-- Ejecutar una sola vez sobre una base de datos ya existente:
--   psql -U postgres -d restaurante -f src/config/migracion_comidas.sql

ALTER TABLE empresas
    ADD COLUMN IF NOT EXISTS habilita_desayuno boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS habilita_almuerzo boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS habilita_merienda boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS habilita_cena boolean DEFAULT false;

ALTER TABLE detalles_pedidos
    ADD COLUMN IF NOT EXISTS tipo_comida VARCHAR(20) NOT NULL DEFAULT 'almuerzo'
        CHECK (tipo_comida IN ('desayuno', 'almuerzo', 'merienda', 'cena'));

ALTER TABLE detalles_pedidos
    ALTER COLUMN menu_semanal_id DROP NOT NULL;

ALTER TABLE detalles_pedidos
    DROP CONSTRAINT IF EXISTS detalles_pedidos_pedido_id_funcionario_id_key;

ALTER TABLE detalles_pedidos
    ADD CONSTRAINT detalles_pedidos_pedido_funcionario_tipo_key UNIQUE (pedido_id, funcionario_id, tipo_comida);
