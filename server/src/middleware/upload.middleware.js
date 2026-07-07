'use strict';
const multer = require('multer');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const MAX_SIZE = (env.MAX_FILE_SIZE_MB || 15) * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_MAGIC_BYTES = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
};

/**
 * Validate magic bytes of the file buffer against declared MIME type.
 * Prevents content-type spoofing.
 */
const validateMagicBytes = (buffer, mimeType) => {
  const expected = ALLOWED_MAGIC_BYTES[mimeType];
  if (!expected) return false;
  return expected.every((byte, i) => buffer[i] === byte);
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      AppError.badRequest(`File type not allowed. Accepted: JPEG, PNG, WebP`),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE,
    files: 1,
  },
});

/**
 * Post-upload magic byte validation middleware.
 * Call after multer has populated req.file.
 */
const validateMagicBytesMiddleware = (req, res, next) => {
  if (!req.file) return next();
  if (!validateMagicBytes(req.file.buffer, req.file.mimetype)) {
    return next(AppError.badRequest('File content does not match declared type'));
  }
  next();
};

/**
 * Handle multer errors gracefully.
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(AppError.badRequest(`File too large. Max size: ${env.MAX_FILE_SIZE_MB} MB`));
    }
    return next(AppError.badRequest(err.message));
  }
  next(err);
};

module.exports = { upload, validateMagicBytesMiddleware, handleUploadError };
