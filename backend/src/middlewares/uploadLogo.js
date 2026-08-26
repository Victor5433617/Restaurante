const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, './uploads/logos/');
    },
    filename :(req, file, cb) =>{
        const nombreUnico = Date.now() + path.extname(file.originalname);
        cb(null, nombreUnico);
    },
})

const upload = multer({ storage });

module.exports = upload;