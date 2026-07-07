'use strict';
const ratingsRepo = require('./ratings.repository');
const AppError = require('../../utils/AppError');

const getForDestination = async (destinationId) => {
  const [ratings, aggregate] = await Promise.all([
    ratingsRepo.findByDestination(destinationId),
    ratingsRepo.findAggregate(destinationId),
  ]);
  return { ratings, aggregate };
};

const createRating = async (userId, destinationId, body) => {
  return ratingsRepo.create(userId, destinationId, body);
};

const updateRating = async (ratingId, userId, body) => {
  const updated = await ratingsRepo.update(ratingId, userId, body);
  if (!updated) throw AppError.notFound('Rating not found');
  return updated;
};

const deleteRating = async (ratingId, userId) => {
  const deleted = await ratingsRepo.deleteById(ratingId, userId);
  if (!deleted) throw AppError.notFound('Rating not found or not owned by you');
};

module.exports = { getForDestination, createRating, updateRating, deleteRating };
