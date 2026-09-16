require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../src/config/db');

const RUC_DEMO = '80000000-1';
const NOMBRE_EMPRESA = 'Empresa Demo Test';

const FUNCIONARIOS = [
    'Ana Benítez',
    'Carlos Duarte',
    'Diego Espínola',
    'Elena González',
    'Fernando Ortiz',
    'Gabriela Ramírez',
    'Hugo Salinas',
    'Irene Villalba',
    'Jorge Acuña',
    'Lucía Fernández',
];

const PLATOS = [
    'Lomo salteado',
    'Milanesa napolitana',
    'Pasta bolognesa',
    'Pechuga a la plancha',
    'Sopa paraguaya',
    'Vori vori',
    'Tortilla de arroz',
    'Chipsa',
    'Fideos a la cacerola',
    'Pollo al horno con ensalada',
];

const FECHA_DESDE = '2026-07-01';
const FECHA_HASTA = '2026-07-30';

const USUARIOS_DEMO = [
    { email: 'encargada.demo@test.com', password: 'demo1234', rol: 'encargada' },
    { email: 'kiosco.demo@test.com', password: 'demo1234', rol: 'funcionario' },
];

function sumarDias(fechaISO, dias) {
    const f = new Date(fechaISO + 'T00:00:00');
    f.setDate(f.getDate() + dias);
    return f.toISOString().slice(0, 10);
}

async function main() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            'DELETE FROM menu_semanal WHERE fecha BETWEEN $1 AND $2',
            [FECHA_DESDE, FECHA_HASTA]
        );
        await client.query('DELETE FROM usuarios WHERE email = ANY($1::text[])', [
            USUARIOS_DEMO.map((u) => u.email),
        ]);
        await client.query('DELETE FROM empresas WHERE ruc_identificador = $1', [RUC_DEMO]);

        const empresaRes = await client.query(
            'INSERT INTO empresas (nombre, ruc_identificador) VALUES ($1, $2) RETURNING id',
            [NOMBRE_EMPRESA, RUC_DEMO]
        );
        const empresaId = empresaRes.rows[0].id;

        const funcionarios = [];
        for (const nombre of FUNCIONARIOS) {
            const res = await client.query(
                'INSERT INTO funcionarios (empresa_id, nombre_completo) VALUES ($1, $2) RETURNING id',
                [empresaId, nombre]
            );
            funcionarios.push(res.rows[0]);
        }

        const menuesPorFecha = new Map();
        const totalDias = 30;
        for (let d = 0; d < totalDias; d++) {
            const fecha = sumarDias(FECHA_DESDE, d);
            const opciones = [];
            for (let op = 1; op <= 3; op++) {
                const plato = PLATOS[(d * 3 + op - 1) % PLATOS.length];
                const res = await client.query(
                    'INSERT INTO menu_semanal (fecha, opcion_numero, plato_nombre, descripcion) VALUES ($1, $2, $3, $4) RETURNING id, opcion_numero',
                    [fecha, op, plato, '']
                );
                opciones.push(res.rows[0]);
            }
            menuesPorFecha.set(fecha, opciones);
        }

        let totalPedidos = 0;
        let totalDetalles = 0;
        for (let d = 0; d < totalDias; d++) {
            const fecha = sumarDias(FECHA_DESDE, d);
            const pedidoRes = await client.query(
                'INSERT INTO pedidos_diarios (empresa_id, fecha) VALUES ($1, $2) RETURNING id',
                [empresaId, fecha]
            );
            const pedidoId = pedidoRes.rows[0].id;
            totalPedidos++;

            const opciones = menuesPorFecha.get(fecha);
            for (const f of funcionarios) {
                if ((f.id + d) % 11 === 3) continue;

                const opcion = opciones[(f.id + d) % opciones.length];
                const observacion = (f.id + d) % 10 === 0 ? 'Sin sal' : '';
                await client.query(
                    'INSERT INTO detalles_pedidos (pedido_id, funcionario_id, menu_semanal_id, observacion) VALUES ($1, $2, $3, $4)',
                    [pedidoId, f.id, opcion.id, observacion]
                );
                totalDetalles++;
            }
        }

        for (const u of USUARIOS_DEMO) {
            const hash = await bcrypt.hash(u.password, 10);
            await client.query(
                'INSERT INTO usuarios (email, password_hash, rol, empresa_id) VALUES ($1, $2, $3, $4)',
                [u.email, hash, u.rol, empresaId]
            );
        }

        await client.query('COMMIT');

        console.log('Seed completado:');
        console.log(`- Empresa id=${empresaId} "${NOMBRE_EMPRESA}" (RUC ${RUC_DEMO})`);
        console.log(`- Funcionarios: ${funcionarios.length}`);
        console.log(`- Menú semanal: 30 días x 3 opciones = ${menuesPorFecha.size * 3} ítems`);
        console.log(`- Pedidos diarios: ${totalPedidos}`);
        console.log(`- Detalles (almuerzos anotados): ${totalDetalles}`);
        console.log('- Usuarios demo:');
        for (const u of USUARIOS_DEMO) {
            console.log(`    ${u.email} / ${u.password} (${u.rol})`);
        }
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

main().then(
    () => process.exit(0),
    (err) => {
        console.error('Error:', err.message);
        process.exit(1);
    }
);