const empresaModel= require('../models/empresaModel');

async function listar(req,res){
    try {
        const empresaid = req.usuario.rol !== 'admin' ? req.usuario.empresa_id : null;
        const empresas = await empresaModel.ObtenerTodos(empresaid);
        res.status(200).json({sucess: true, data: empresas});
    } catch (error) {
        res.status(500).json({sucess: false, error: error.message});
    }
}

async function Crear(req,res){
    try {
        const nuevaEmpresa = await empresaModel.CrearEmpresas(req.body);
        res.status(201).json({sucess: true, data: nuevaEmpresa});
    } catch (error) {
        res.status(500).json({sucess: false, error: error.message});
    }
}


async function editar(req,res) {
    try {
        const actualizarEmpresa = await empresaModel.editarEmpresas(req.params.id, req.body);
        if(!actualizarEmpresa){
            return res.status(404).json({sucess:false, error:'Empresas no encontrada'});
        }

        res.status(200).json({sucess: true, data: actualizarEmpresa});
        console.log(actualizarEmpresa);
    } catch (error) {
        res.status(500).json({sucess:false, error: error.message});
        console.log(error);
    }
}

async function eliminar(req,res) {
    try {
        const resultado = await empresaModel.eliminar(req.params.id);
        if(resultado.length === 0){
            return res.status(404).json({sucess: false, error: 'Recurso no encontrado'});
            console.log('Empresa no encontrada');
        }

        res.status(200).json({sucess: true, message: 'Empresa eliminada correctamente'});
        console.log('Empresas eliminada correctamente');
    } catch (error) {
        res.status(500).json({sucess: false, error: error.message});
        console.log(error);
    }
}

async function subirLogo(req,res) {
    try {
        if (req.usuario.rol !== 'admin' && Number(req.params.id) !== req.usuario.empresa_id) {
            return res.status(403).json({ sucess: false, error: 'No podés modificar el logo de otra empresa' });
        }
        const subirLogo = await empresaModel.subirLogo(req.params.id, req.file.filename);
        if(!subirLogo){
            return res.status(404).json({sucess: false, error:'No encontrada'});
            console.log('Empresa no encontrada')
        }
        res.status(200).json({sucess: true, data: subirLogo});
        console.log(subirLogo);
    } catch (error) {
        res.status(500).json({sucess: false, error: error.message});
        console.log(error);
    }
}

async function conteoHoy(req, res) {
    try {
        const empresaId = req.usuario.rol !== 'admin' ? req.usuario.empresa_id : null;
        const conteoHoy = await empresaModel.conteoHoy(empresaId);
        res.status(200).json({sucess: true , data: conteoHoy});

    } catch (error) {
        res.status(500).json({sucess: false, error: error.message});
        console.log(error);      
    }
}

module.exports = {listar, Crear, editar,eliminar,subirLogo, conteoHoy};