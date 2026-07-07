'use strict';
const sharp = require('sharp');

/**
 * Strip EXIF metadata from an image buffer and return clean buffer.
 * Uses sharp to re-encode the image, which drops all metadata by default.
 * @param {Buffer} buffer - Raw image buffer
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<Buffer>}
 */
const stripExif = async (buffer, mimeType) => {
  let pipeline = sharp(buffer).rotate(); // auto-rotate based on EXIF, then strip
  
  switch (mimeType) {
    case 'image/jpeg':
      pipeline = pipeline.jpeg({ quality: 90 });
      break;
    case 'image/png':
      pipeline = pipeline.png({ compressionLevel: 8 });
      break;
    case 'image/webp':
      pipeline = pipeline.webp({ quality: 90 });
      break;
    default:
      pipeline = pipeline.jpeg({ quality: 90 });
  }

  return pipeline.toBuffer();
};

/**
 * Generate a thumbnail buffer at 400px width.
 * @param {Buffer} buffer - Raw image buffer (EXIF already stripped)
 * @returns {Promise<Buffer>}
 */
const generateThumbnail = async (buffer) => {
  return sharp(buffer)
    .resize({ width: 400, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
};

/**
 * Get image dimensions.
 * @param {Buffer} buffer
 * @returns {Promise<{width: number, height: number}>}
 */
const getDimensions = async (buffer) => {
  const metadata = await sharp(buffer).metadata();
  return { width: metadata.width, height: metadata.height };
};

module.exports = { stripExif, generateThumbnail, getDimensions };
