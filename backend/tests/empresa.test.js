const {
    app,
    request,
    BASE,
    crearEmpresa,
    crearUsuario,
    login,
    limpiarTodo,
} = require('./helpers');

describe('Empresas', () => {
    beforeEach(async () => {
        await limpiarTodo();
    });

    afterAll(async () => {
        await limpiarTodo();
    });

    async function adminToken() {
        const admin = await crearUsuario({ email: 'admin_emp@test.com', password: 'secreto123', rol: 'admin', empresa_id: null });
        return login(admin.email, 'secreto123');
    }

    test('crear empresa requiere nombre (validación 400)', async () => {
        const token = await adminToken();
        const res = await request(app)
            .post(`${BASE}/empresas`)
            .set('Authorization', `Bearer ${token}`)
            .send({ ruc_identificador: '123456' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('nombre');
    });

    test('admin crea empresa correctamente', async () => {
        const token = await adminToken();
        const res = await request(app)
            .post(`${BASE}/empresas`)
            .set('Authorization', `Bearer ${token}`)
            .send({ nombre: 'Empresa Nueva', ruc_identificador: '999999' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.nombre).toBe('Empresa Nueva');
    });

    test('encargada no puede crear empresa (403)', async () => {
        const empresa = await crearEmpresa('Empresa Base');
        const enc = await crearUsuario({ email: 'enc_emp@test.com', password: 'secreto123', rol: 'encargada', empresa_id: empresa.id });
        const token = await login(enc.email, 'secreto123');

        const res = await request(app)
            .post(`${BASE}/empresas`)
            .set('Authorization', `Bearer ${token}`)
            .send({ nombre: 'No Debería' });

        expect(res.status).toBe(403);
    });

    test('listar empresas sin token devuelve 401', async () => {
        const res = await request(app).get(`${BASE}/empresas`);
        expect(res.status).toBe(401);
    });

    test('listar empresas con token devuelve lista', async () => {
        const token = await adminToken();
        await crearEmpresa('Empresa Lista A');
        await crearEmpresa('Empresa Lista B');

        const res = await request(app)
            .get(`${BASE}/empresas`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    test('editar empresa inexistente devuelve 404', async () => {
        const token = await adminToken();
        const res = await request(app)
            .put(`${BASE}/empresas/999999`)
            .set('Authorization', `Bearer ${token}`)
            .send({ nombre: 'Editada', ruc_identificador: '123' });

        expect(res.status).toBe(404);
    });
});
