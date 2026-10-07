const multer = require('multer');
const path = require('path');

const EXTENSIONES_PERMITIDAS = ['.png', '.jpg', '.jpeg', '.webp'];

const usaCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME);

const storage = usaCloudinary
    ? multer.memoryStorage()
    : multer.diskStorage({
          destination: (req, file, cb) => {
              cb(null, './uploads/logos/');
          },
          filename: (req, file, cb) => {
              const extension = path.extname(file.originalname).toLowerCase();
              const nombreUnico = Date.now() + extension;
              cb(null, nombreUnico);
          },
      });

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
            const error = new Error('Formato de imagen no permitido. Usá PNG, JPG, JPEG o WebP.');
            error.status = 400;
            return cb(error);
        }
        cb(null, true);
    },
});

module.exports = upload;
