const {
    app,
    request,
    BASE,
    crearUsuario,
    crearMenu,
    login,
    limpiarTodo,
} = require('./helpers');

describe('Menú semanal', () => {
    beforeEach(async () => {
        await limpiarTodo();
    });

    afterAll(async () => {
        await limpiarTodo();
    });

    async function adminToken() {
        const admin = await crearUsuario({ email: 'admin_menu@test.com', password: 'secreto123', rol: 'admin', empresa_id: null });
        return login(admin.email, 'secreto123');
    }

    test('crear menú sin nombre de plato da 400', async () => {
        const token = await adminToken();
        const res = await request(app)
            .post(`${BASE}/menu`)
            .set('Authorization', `Bearer ${token}`)
            .send({ fecha: '2026-08-31', opcion_numero: 1 });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('plato');
    });

    test('crear menú correctamente', async () => {
        const token = await adminToken();
        const res = await request(app)
            .post(`${BASE}/menu`)
            .set('Authorization', `Bearer ${token}`)
            .send({ fecha: '2026-08-31', opcion_numero: 1, plato_nombre: 'Milanesa test', descripcion: 'con puré' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.plato_nombre).toBe('Milanesa test');
    });

    test('crear menú con lista vacía da 400', async () => {
        const token = await adminToken();
        const res = await request(app)
            .post(`${BASE}/menu`)
            .set('Authorization', `Bearer ${token}`)
            .send([]);

        expect(res.status).toBe(400);
    });

    test('editar menú inexistente devuelve 404 con mensaje de menú (bug corregido)', async () => {
        const token = await adminToken();
        const res = await request(app)
            .put(`${BASE}/menu/999999`)
            .set('Authorization', `Bearer ${token}`)
            .send({ plato_nombre: 'Editado test', descripcion: 'x' });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Menú no encontrado');
    });

    test('editar menú existente funciona', async () => {
        const token = await adminToken();
        const menu = await crearMenu('2026-09-01', 2, 'Guiso test');

        const res = await request(app)
            .put(`${BASE}/menu/${menu.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ plato_nombre: 'Guiso editado test', descripcion: 'nuevo' });

        expect(res.status).toBe(200);
        expect(res.body.data.plato_nombre).toBe('Guiso editado test');
    });
});
