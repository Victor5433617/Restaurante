const {
    app,
    request,
    BASE,
    crearEmpresa,
    crearUsuario,
    crearFuncionario,
    login,
    limpiarTodo,
} = require('./helpers');

describe('Funcionarios', () => {
    beforeEach(async () => {
        await limpiarTodo();
    });

    afterAll(async () => {
        await limpiarTodo();
    });

    test('crear funcionario sin nombre da 400', async () => {
        const empresa = await crearEmpresa('Empresa Func');
        const admin = await crearUsuario({ email: 'admin_func@test.com', password: 'secreto123', rol: 'admin', empresa_id: null });
        const token = await login(admin.email, 'secreto123');

        const res = await request(app)
            .post(`${BASE}/funcionarios`)
            .set('Authorization', `Bearer ${token}`)
            .send({ empresa_id: empresa.id });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('nombre');
    });

    test('admin crea funcionario correctamente', async () => {
        const empresa = await crearEmpresa('Empresa Func');
        const admin = await crearUsuario({ email: 'admin_func2@test.com', password: 'secreto123', rol: 'admin', empresa_id: null });
        const token = await login(admin.email, 'secreto123');

        const res = await request(app)
            .post(`${BASE}/funcionarios`)
            .set('Authorization', `Bearer ${token}`)
            .send({ empresa_id: empresa.id, nombre_completo: 'Juan Test' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.nombre_completo).toBe('Juan Test');
    });

    test('encargada puede listar solo sus funcionarios', async () => {
        const empresaA = await crearEmpresa('Empresa A');
        const empresaB = await crearEmpresa('Empresa B');
        await crearFuncionario(empresaA.id, 'F1 A');
        await crearFuncionario(empresaB.id, 'F1 B');

        const enc = await crearUsuario({ email: 'enc_func@test.com', password: 'secreto123', rol: 'encargada', empresa_id: empresaA.id });
        const token = await login(enc.email, 'secreto123');

        const res = await request(app)
            .get(`${BASE}/funcionarios`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].empresa_id).toBe(empresaA.id);
    });

    test('eliminar funcionario lo desactiva', async () => {
        const empresa = await crearEmpresa('Empresa Del');
        const admin = await crearUsuario({ email: 'admin_del@test.com', password: 'secreto123', rol: 'admin', empresa_id: null });
        const token = await login(admin.email, 'secreto123');
        const func = await crearFuncionario(empresa.id, 'F Del');

        const res = await request(app)
            .delete(`${BASE}/funcionarios/${func.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
