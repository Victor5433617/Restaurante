const {
    app,
    request,
    BASE,
    crearEmpresa,
    crearUsuario,
    crearFuncionario,
    crearMenu,
    login,
    limpiarTodo,
} = require('./helpers');

describe('Pedidos', () => {
    beforeEach(async () => {
        await limpiarTodo();
    });

    afterAll(async () => {
        await limpiarTodo();
    });

    test('crear pedido completo con detalles inválidos da 400', async () => {
        const empresa = await crearEmpresa('Empresa Ped');
        const admin = await crearUsuario({ email: 'admin_ped@test.com', password: 'secreto123', rol: 'admin', empresa_id: null });
        const token = await login(admin.email, 'secreto123');

        const res = await request(app)
            .post(`${BASE}/pedidos/completo`)
            .set('Authorization', `Bearer ${token}`)
            .send({ empresa_id: empresa.id, fecha: '2026-09-01', detalles: [] });

        expect(res.status).toBe(400);
    });

    test('funcionario no puede crear pedidos de otra empresa (403)', async () => {
        const empresaA = await crearEmpresa('Empresa A');
        const empresaB = await crearEmpresa('Empresa B');
        const func = await crearUsuario({ email: 'func_ped@test.com', password: 'secreto123', rol: 'funcionario', empresa_id: empresaA.id });
        const token = await login(func.email, 'secreto123');

        const res = await request(app)
            .post(`${BASE}/pedidos`)
            .set('Authorization', `Bearer ${token}`)
            .send({ empresa_id: empresaB.id, fecha: '2026-09-01' });

        expect(res.status).toBe(403);
    });

    test('anotar funcionario en pedido funciona', async () => {
        const empresa = await crearEmpresa('Empresa Anotar');
        const funcionario = await crearFuncionario(empresa.id, 'F Anotar');
        const menu = await crearMenu('2026-09-02', 1, 'Plato anotar test');
        const admin = await crearUsuario({ email: 'admin_anotar@test.com', password: 'secreto123', rol: 'admin', empresa_id: null });
        const token = await login(admin.email, 'secreto123');

        const res = await request(app)
            .post(`${BASE}/pedidos/anotar`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                empresa_id: empresa.id,
                fecha: '2026-09-02',
                funcionario_id: funcionario.id,
                menu_semanal_id: menu.id,
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.detalle.funcionario_id).toBe(funcionario.id);
    });

    test('obtener detalle de pedido inexistente devuelve 404', async () => {
        const admin = await crearUsuario({ email: 'admin_det@test.com', password: 'secreto123', rol: 'admin', empresa_id: null });
        const token = await login(admin.email, 'secreto123');

        const res = await request(app)
            .get(`${BASE}/pedidos/999999`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });
});
