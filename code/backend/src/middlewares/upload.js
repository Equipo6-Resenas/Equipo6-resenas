const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Directorio de uploads dentro del backend (desde middlewares: ../../uploads/resenas)
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.isAbsolute(process.env.UPLOAD_DIR)
    ? process.env.UPLOAD_DIR
    : path.join(__dirname, '..', '..', process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', '..', 'uploads', 'resenas');
const MAX_FILE_SIZE = Number(process.env.MAX_IMAGE_SIZE_MB) * 1024 * 1024 || 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png').split(',');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`Formato de imagen no permitido. Formatos aceptados: ${ALLOWED_MIME_TYPES.join(', ')}`);
    error.statusCode = 400;
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const error = new Error(`El archivo supera el tamaño máximo permitido de ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      error.statusCode = 400;
      error.code = 'FILE_TOO_LARGE';
      return next(error);
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      const error = new Error('Solo se permite subir una imagen por reseña');
      error.statusCode = 400;
      error.code = 'TOO_MANY_FILES';
      return next(error);
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      const error = new Error('Campo de archivo inesperado. Use el campo "imagen"');
      error.statusCode = 400;
      error.code = 'UNEXPECTED_FIELD';
      return next(error);
    }
  }
  if (err.statusCode) {
    return next(err);
  }
  next(err);
};

module.exports = {
  upload,
  handleMulterError,
  UPLOAD_DIR,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES
};