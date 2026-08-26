const funcionarioModel = require ('../models/funcionarioModel');

async function listar(req,res) {
    try {
        const empresaId = req.usuario.rol !== 'admin' ? req.usuario.empresa_id : null;
        const funcionarios = await funcionarioModel.ObtenerTodosF(empresaId);
        res.status(200).json({sucess: true, data: funcionarios});
    } catch (error) {
     res.status(500).json({sucess: false, error: error.message});
    }
}

async function Crear(req,res) {
    try {
        const dato = { ...req.body };
        if (req.usuario.rol !== 'admin') {
            dato.empresa_id = req.usuario.empresa_id;
        }
        const NuevoFuncionario = await funcionarioModel.CrearF(dato);
        res.status(201).json({sucess: true, data: NuevoFuncionario});
        console.log(NuevoFuncionario);
    } catch (error) {
        res.status(500).json({sucess: false, error: error.message});
        console.log('Controller' + error);
    }

}

async function editar(req,res) {
    try {
        if (req.usuario.rol !== 'admin') {
            const funcionarioActual = await funcionarioModel.obtenerPorId(req.params.id);
            if (!funcionarioActual || funcionarioActual.empresa_id !== req.usuario.empresa_id) {
                return res.status(403).json({sucess: false, error: 'No podés editar funcionarios de otra empresa'});
            }
        }
        const dato = { ...req.body };
        if (req.usuario.rol !== 'admin') {
            dato.empresa_id = req.usuario.empresa_id;
        }
        const editarFuncionario = await funcionarioModel.editarF(req.params.id, dato);
        if(!editarFuncionario){
          return  res.status(404).json({sucess: false, error: 'Funcionario no encontrado'});
        }
     res.status(200).json({sucess: true, data: editarFuncionario});
     console.log(editarFuncionario);
    } catch (error) {
        res.status(500).json({sucess: false, error: error.message});
        console.log(error);
     }
}


async function eliminar(req,res) {
    try {
        if (req.usuario.rol !== 'admin') {
            const funcionarioActual = await funcionarioModel.obtenerPorId(req.params.id);
            if (!funcionarioActual || funcionarioActual.empresa_id !== req.usuario.empresa_id) {
                return res.status(403).json({sucess: false, error: 'No podés eliminar funcionarios de otra empresa'});
            }
        }
        const eliminarFuncionarios = await funcionarioModel.eliminarF(req.params.id);

        if(eliminarFuncionarios.length ===0){
            return res.status(404).json({sucess: false, message: 'Funcionario no encontrado'});
        }

        res.status(200).json({sucess: true, data: 'Dado de baja correctamente'});
        console.log('Dado de baja correctamente')
    } catch (error) {
        res.status(500).json({sucess: false, error: error.message});
        console.log(error);
    }
}

module.exports = {listar,Crear,editar,eliminar};