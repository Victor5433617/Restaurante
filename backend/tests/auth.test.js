const {
    app,
    request,
    BASE,
    crearEmpresa,
    crearUsuario,
    login,
    limpiarTodo,
} = require('./helpers');

describe('Auth', () => {
    beforeEach(async () => {
        await limpiarTodo();
    });

    afterAll(async () => {
        await limpiarTodo();
    });

    test('login correcto devuelve token y usuario', async () => {
        const empresa = await crearEmpresa('Empresa Login');
        const usuario = await crearUsuario({ email: 'auth_admin@test.com', password: 'secreto123', rol: 'admin', empresa_id: empresa.id });

        const res = await request(app)
            .post(`${BASE}/auth/login`)
            .send({ email: usuario.email, password: 'secreto123' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
        expect(res.body.data.usuario.rol).toBe('admin');
    });

    test('login con credenciales inválidas devuelve 401', async () => {
        const res = await request(app)
            .post(`${BASE}/auth/login`)
            .send({ email: 'noexiste@test.com', password: 'incorrecta' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    test('registro valida email y contraseña (400)', async () => {
        const admin = await crearUsuario({ email: 'admin_global@test.com', password: 'secreto123', rol: 'admin', empresa_id: null });
        const token = await login(admin.email, 'secreto123');
        const res = await request(app)
            .post(`${BASE}/auth/registro`)
            .set('Authorization', `Bearer ${token}`)
            .send({ email: 'invalido', password: '1', rol: 'encargada' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('Email');
    });

    test('encargada no puede crear admin', async () => {
        const empresa = await crearEmpresa('Empresa Enc');
        const encargada = await crearUsuario({ email: 'enc_admin@test.com', password: 'secreto123', rol: 'encargada', empresa_id: empresa.id });
        const token = await login(encargada.email, 'secreto123');

        const res = await request(app)
            .post(`${BASE}/auth/registro`)
            .set('Authorization', `Bearer ${token}`)
            .send({ email: 'nuevo@test.com', password: 'secreto123', rol: 'admin' });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
    });

    test('crear usuario requiere token', async () => {
        const res = await request(app)
            .post(`${BASE}/auth/registro`)
            .send({ email: 'x@test.com', password: 'secreto123', rol: 'encargada' });

        expect(res.status).toBe(401);
    });

    test('cambiar contraseña valida longitud (400)', async () => {
        const admin = await crearUsuario({ email: 'passadmin@test.com', password: 'secreto123', rol: 'admin', empresa_id: null });
        const token = await login(admin.email, 'secreto123');

        const res = await request(app)
            .put(`${BASE}/auth/usuarios/contrasena`)
            .set('Authorization', `Bearer ${token}`)
            .send({ email: 'cualquiera@test.com', nueva_password: '1' });

        expect(res.status).toBe(400);
    });
});
