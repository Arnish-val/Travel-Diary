'use strict';
const recRepo = require('./recommendations.repository');

/**
 * Get personalized recommendations for a user.
 * If cached recommendation list is short, computes new recommendations.
 */
const getRecommendations = async (userId, limit = 10) => {
  let stored = await recRepo.findStoredRecommendations(userId, limit);

  // If there are too few stored recommendations, compute fresh ones
  if (stored.length < 3) {
    const computed = await recRepo.computeContentRecommendations(userId, limit);
    if (computed.length > 0) {
      await recRepo.saveRecommendations(userId, computed);
      stored = await recRepo.findStoredRecommendations(userId, limit);
    }
  }

  return stored;
};

/**
 * Force computation of fresh recommendations.
 */
const refreshRecommendations = async (userId, limit = 10) => {
  const computed = await recRepo.computeContentRecommendations(userId, limit);
  if (computed.length > 0) {
    await recRepo.saveRecommendations(userId, computed);
  }
  return recRepo.findStoredRecommendations(userId, limit);
};

/**
 * Update the seen / dismissed status of a recommendation.
 */
const updateStatus = async (id, userId, status) => {
  return recRepo.updateStatus(id, userId, status);
};

module.exports = {
  getRecommendations,
  refreshRecommendations,
  updateStatus,
};
