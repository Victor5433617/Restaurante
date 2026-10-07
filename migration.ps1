param(
    [string]$ConnectionString = "postgresql://postgres:postgres@localhost:5432/restaurante"
)

# Uso:
#   .\migration.ps1                         -> corre contra tu Postgres local (restaurante)
#   .\migration.ps1 -ConnectionString "..."  -> corre contra otra base (ej: Neon en produccion)
#
# Nota: migracion_comidas.sql es para actualizar una base YA EXISTENTE que fue creada
# antes de que el sistema soportara desayuno/merienda/cena. Una base nueva (creada con
# schema.sql) ya incluye esas columnas y no necesita este script.

& "C:\Program Files\PostgreSQL\18\bin\psql.exe" $ConnectionString -f backend/src/config/migracion_comidas.sql
