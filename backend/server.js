require('dotenv').config();
const express = require ('express');
const pool = require('./src/config/db')
const app = express();
const PORT = process.env.PORT;
const morgan = require('morgan')
const cors = require ('cors')
const empresasRoutes = require ('./src/routes/empresaRoutes');
const funcionarioRoutes = require('./src/routes/funcionarioRoutes');
const menuRoutes = require('./src/routes/menuRoutes');
const pedidoRoutes = require('./src/routes/pedidoRoutes');
const authRoutes = require('./src/routes/authRoutes');
const configRoutes = require('./src/routes/configRoutes');
const verificarToken = require('./src/middlewares/verificarToken');
const verificarRol = require ('./src/middlewares/verificarRol');
app.use(cors());
app.use(morgan('dev'))
app.use(express.json());

//rutas
app.use('/api/empresas', empresasRoutes);
app.use('/api/funcionarios', funcionarioRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/menu', menuRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);



app.get('/api/test', async (req, res) =>{
   try {
        const resultado = await pool.query('SELECT NOW()');
        res.status(200).send( `Funcionando ${resultado.rows[0].now}` );
        console.log(`Funcionando ${resultado.rows[0].now}`);
    } catch (error) {
        res.status(500).json({ sucess: false, error: error.message });
    }
})


app.get('/api/privado', verificarToken, (req, res)=>{
    res.json({mensaje: 'Accediste correctamente', usuario: req.usuario});
})



app.get('/api/solo-admin', verificarToken, verificarRol('admin'), (req, res) => {
  res.json({ mensaje: 'Sos admin, entraste' });
})


app.listen(PORT,()=>{
    console.log(`Servidor Corriendo http://localhost:${PORT}`)
})







