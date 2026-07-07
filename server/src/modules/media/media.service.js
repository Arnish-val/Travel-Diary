'use strict';
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const { s3Client, deleteObject, getPresignedUrl, BUCKET } = require('../../config/s3');
const { query } = require('../../config/db');
const { stripExif, generateThumbnail } = require('../../utils/imageProcessor');
const AppError = require('../../utils/AppError');
const tripsRepo = require('../trips/trips.repository');
const env = require('../../config/env');

const QUOTA_BYTES = (env.USER_STORAGE_QUOTA_GB || 5) * 1024 * 1024 * 1024;

/**
 * Get current storage usage for a user in bytes.
 */
const getUserStorageUsed = async (userId) => {
  const result = await query(
    'SELECT COALESCE(SUM(size_bytes), 0)::bigint AS used FROM media WHERE user_id = $1',
    [userId]
  );
  return parseInt(result.rows[0].used, 10);
};

/**
 * Upload a media file:
 * 1. Check quota
 * 2. Strip EXIF
 * 3. Generate thumbnail
 * 4. Upload both to S3
 * 5. Insert DB record
 */
const uploadMedia = async (tripId, userId, file, metadata = {}) => {
  // Check trip ownership
  const trip = await tripsRepo.findById(tripId);
  if (!trip) throw AppError.notFound('Trip not found');
  if (trip.user_id !== userId) throw AppError.forbidden();

  // Check file count per trip
  const countResult = await query(
    'SELECT COUNT(*) FROM media WHERE trip_id = $1',
    [tripId]
  );
  if (parseInt(countResult.rows[0].count, 10) >= (env.MAX_FILES_PER_TRIP || 50)) {
    throw AppError.badRequest(`Maximum ${env.MAX_FILES_PER_TRIP} files per trip`);
  }

  // Check quota
  const used = await getUserStorageUsed(userId);
  if (used + file.size > QUOTA_BYTES) {
    throw AppError.badRequest('Storage quota exceeded');
  }

  // Process image
  const cleanBuffer = await stripExif(file.buffer, file.mimetype);
  const thumbnailBuffer = await generateThumbnail(cleanBuffer);

  // Build S3 keys
  const mediaId = uuidv4();
  const ext = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
  const mediaKey = `media/${userId}/${tripId}/${mediaId}.${ext}`;
  const thumbKey = `media/${userId}/${tripId}/${mediaId}_thumb.webp`;

  // Upload to S3
  await Promise.all([
    s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: mediaKey,
      Body: cleanBuffer,
      ContentType: file.mimetype,
    })),
    s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: thumbKey,
      Body: thumbnailBuffer,
      ContentType: 'image/webp',
    })),
  ]);

  // Insert DB record
  const result = await query(
    `INSERT INTO media
       (id, trip_id, user_id, url, thumbnail_url, caption, mime_type, size_bytes, latitude, longitude, taken_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      mediaId, tripId, userId,
      mediaKey, thumbKey,
      metadata.caption || null,
      file.mimetype,
      cleanBuffer.length,
      metadata.latitude || null,
      metadata.longitude || null,
      metadata.taken_at || null,
    ]
  );

  return result.rows[0];
};

/**
 * Get media list for a trip with pre-signed URLs.
 */
const getTripMedia = async (tripId, userId, { limit = 20, cursor = null }) => {
  const trip = await tripsRepo.findById(tripId);
  if (!trip) throw AppError.notFound('Trip not found');
  if (trip.privacy === 'private' && trip.user_id !== userId) throw AppError.forbidden();

  const params = [tripId, limit + 1];
  let cursorClause = '';
  if (cursor) {
    params.push(cursor);
    cursorClause = `AND m.id < $${params.length}`;
  }

  const result = await query(
    `SELECT * FROM media m
     WHERE m.trip_id = $1 ${cursorClause}
     ORDER BY m.created_at DESC
     LIMIT $2`,
    params
  );

  const items = result.rows.slice(0, limit);
  const hasNext = result.rows.length > limit;

  // Attach pre-signed URLs
  const itemsWithUrls = await Promise.all(
    items.map(async (m) => ({
      ...m,
      url: await getPresignedUrl(m.url),
      thumbnail_url: m.thumbnail_url ? await getPresignedUrl(m.thumbnail_url) : null,
    }))
  );

  return {
    items: itemsWithUrls,
    meta: { count: items.length, hasNext, nextCursor: hasNext ? items[items.length - 1].id : null },
  };
};

/**
 * Delete a media item from S3 and DB.
 */
const deleteMedia = async (mediaId, userId) => {
  const result = await query(
    'SELECT * FROM media WHERE id = $1',
    [mediaId]
  );
  const media = result.rows[0];
  if (!media) throw AppError.notFound('Media not found');
  if (media.user_id !== userId) throw AppError.forbidden();

  // Delete from S3
  await Promise.allSettled([
    deleteObject(media.url),
    media.thumbnail_url ? deleteObject(media.thumbnail_url) : Promise.resolve(),
  ]);

  // Delete from DB
  await query('DELETE FROM media WHERE id = $1', [mediaId]);
};

/**
 * Update media metadata (caption, geolocation).
 */
const updateMedia = async (mediaId, userId, fields) => {
  const allowed = ['caption', 'latitude', 'longitude', 'taken_at'];
  const updates = [];
  const values = [];
  let idx = 1;

  for (const field of allowed) {
    if (fields[field] !== undefined) {
      updates.push(`${field} = $${idx}`);
      values.push(fields[field]);
      idx++;
    }
  }

  if (!updates.length) throw AppError.badRequest('No fields to update');
  values.push(mediaId, userId);

  const result = await query(
    `UPDATE media SET ${updates.join(', ')}
     WHERE id = $${idx} AND user_id = $${idx + 1}
     RETURNING *`,
    values
  );

  if (!result.rows[0]) throw AppError.notFound('Media not found or not owned by you');
  return result.rows[0];
};

module.exports = { uploadMedia, getTripMedia, deleteMedia, updateMedia, getUserStorageUsed };
