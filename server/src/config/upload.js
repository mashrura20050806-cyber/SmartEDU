const multer = require('multer');
const AppError = require('../utils/AppError');

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 8, fieldSize: 10 * 1024, parts: 10 },
  fileFilter(_req, file, callback) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new AppError('Only PDF, JPEG, PNG, and WebP files are allowed.', 400));
      return;
    }
    callback(null, true);
  },
});

module.exports = { upload, MAX_UPLOAD_BYTES, ALLOWED_MIME_TYPES };