'use strict';
const recService = require('./recommendations.service');
const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');

const getRecommendations = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const items = await recService.getRecommendations(req.user.id, limit);
  res.json({ status: 'success', data: { items } });
});

const refreshRecommendations = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const items = await recService.refreshRecommendations(req.user.id, limit);
  res.json({ status: 'success', data: { items } });
});

const updateStatus = asyncHandler(async (req, res) => {
  const { seen, dismissed } = req.body;
  const item = await recService.updateStatus(req.params.id, req.user.id, { seen, dismissed });
  if (!item) {
    throw AppError.notFound('Recommendation not found');
  }
  res.json({ status: 'success', data: { recommendation: item } });
});

module.exports = {
  getRecommendations,
  refreshRecommendations,
  updateStatus,
};
