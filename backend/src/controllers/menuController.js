const menuModel = require ('../models/menuModel');


async function listarM(req, res) {
    try {
        const MenuListar = await menuModel.ObtenerTodos();
       res.status(200).json({sucess: true, data: MenuListar});
        console.log(MenuListar);
    } catch (error) {
        res.status(500).json({sucess: false, error: error.message});
        console.log(error);
    }
}

async function crearM(req, res) {
    try {
        if (Array.isArray(req.body)) {
            const resultados = await Promise.all(
                req.body.map(item => menuModel.crear(item))
            );
            console.log("Platos creados:", resultados);
            return res.status(201).json({ sucess: true, data: resultados });
        }


        
        const Menucrear = await menuModel.crear(req.body);
        res.status(201).json({sucess: true, data: Menucrear});
        console.log(Menucrear);
    } catch (error) {
        res.status(500).json({sucess: false, error: error.message});
        console.log(error);
    }
}


async function editarM(req, res) {
    try {
        const menuEditar = await menuModel.editar(req.params.id, req.body, );

        if(!menuEditar){
            return res.status(404).json({sucess:false, error:'Empresa no encontrada'});

        }
        res.status(200).json({sucess: true, data: menuEditar});
        console.log(menuEditar);
    } catch (error) {
        res.status(500).json({sucess: false, error: error.message});
        console.log(error);
    }
}

async function menuHoyM(req, res) {
    try {
        const menuHoy = await menuModel.menuHoy();
        res.status(200).json({sucess: true, data: menuHoy});
        console.log(menuHoy);
    } catch (error) {
        res.status(500).json({sucess: false , error: error.message});
        console.log(error)
    }
}

module.exports = {listarM, crearM, menuHoyM, editarM};