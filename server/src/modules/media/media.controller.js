'use strict';
const mediaService = require('./media.service');
const asyncHandler = require('../../utils/asyncHandler');
const { parseCursorPagination } = require('../../utils/pagination');

const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw require('../../utils/AppError').badRequest('No file uploaded');
  const metadata = {
    caption: req.body.caption,
    latitude: req.body.latitude ? parseFloat(req.body.latitude) : undefined,
    longitude: req.body.longitude ? parseFloat(req.body.longitude) : undefined,
    taken_at: req.body.taken_at,
  };
  const media = await mediaService.uploadMedia(req.params.tripId, req.user.id, req.file, metadata);
  res.status(201).json({ status: 'success', data: { media } });
});

const getTripMedia = asyncHandler(async (req, res) => {
  const { limit, cursor } = parseCursorPagination(req.query);
  const result = await mediaService.getTripMedia(req.params.tripId, req.user?.id, { limit, cursor });
  res.json({ status: 'success', ...result });
});

const updateMedia = asyncHandler(async (req, res) => {
  const media = await mediaService.updateMedia(req.params.id, req.user.id, req.body);
  res.json({ status: 'success', data: { media } });
});

const deleteMedia = asyncHandler(async (req, res) => {
  await mediaService.deleteMedia(req.params.id, req.user.id);
  res.status(204).send();
});

const getStorageUsage = asyncHandler(async (req, res) => {
  const used = await mediaService.getUserStorageUsed(req.user.id);
  const env = require('../../config/env');
  const quota = (env.USER_STORAGE_QUOTA_GB || 5) * 1024 * 1024 * 1024;
  res.json({
    status: 'success',
    data: {
      used_bytes: used,
      quota_bytes: quota,
      used_gb: (used / (1024 ** 3)).toFixed(2),
      quota_gb: env.USER_STORAGE_QUOTA_GB,
      percent: ((used / quota) * 100).toFixed(1),
    },
  });
});

module.exports = { uploadMedia, getTripMedia, updateMedia, deleteMedia, getStorageUsage };
