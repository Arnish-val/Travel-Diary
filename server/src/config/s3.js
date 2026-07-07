'use strict';
const { S3Client, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const env = require('./env');

const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for Minio
});

/**
 * Generate a pre-signed GET URL for a given S3 key.
 * @param {string} key - S3 object key
 * @param {number} [expiresIn=3600] - URL expiry in seconds
 * @returns {Promise<string>}
 */
const getPresignedUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Delete an object from S3.
 * @param {string} key - S3 object key
 */
const deleteObject = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  });
  return s3Client.send(command);
};

module.exports = { s3Client, getPresignedUrl, deleteObject, BUCKET: env.S3_BUCKET };
