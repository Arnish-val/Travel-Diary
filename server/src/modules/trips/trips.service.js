'use strict';
const tripsRepo = require('./trips.repository');
const AppError = require('../../utils/AppError');
const { buildCursorMeta } = require('../../utils/pagination');

const getTrips = async (userId, { limit, cursor, sort }) => {
  const rows = await tripsRepo.findByUserIdCursor(userId, { limit, cursor, sort });
  const hasNext = rows.length > limit;
  const items = hasNext ? rows.slice(0, limit) : rows;
  return { items, meta: buildCursorMeta(items, limit) };
};

const getTripById = async (id, userId) => {
  const trip = await tripsRepo.findById(id);
  if (!trip) throw AppError.notFound('Trip not found');
  if (trip.privacy === 'private' && trip.user_id !== userId) {
    throw AppError.forbidden('You do not have access to this trip');
  }
  return trip;
};

const createTrip = async (userId, body) => {
  const trip = await tripsRepo.create(userId, body);
  if (body.destination_ids?.length) {
    for (let i = 0; i < body.destination_ids.length; i++) {
      await tripsRepo.addDestination(trip.id, body.destination_ids[i], i + 1);
    }
  }
  return tripsRepo.findById(trip.id);
};

const updateTrip = async (id, userId, fields) => {
  const existing = await tripsRepo.findById(id);
  if (!existing) throw AppError.notFound('Trip not found');
  if (existing.user_id !== userId) throw AppError.forbidden();

  const updated = await tripsRepo.update(id, userId, fields);
  return updated;
};

const deleteTrip = async (id, userId) => {
  // Note: media S3 deletion is handled in media.service via cascade listener
  // For MVP, media is deleted from DB via cascade; S3 cleanup runs async
  const deleted = await tripsRepo.deleteById(id, userId);
  if (!deleted) throw AppError.notFound('Trip not found');
};

const addDestination = async (tripId, userId, { destination_id, visit_order }) => {
  const trip = await tripsRepo.findById(tripId);
  if (!trip) throw AppError.notFound('Trip not found');
  if (trip.user_id !== userId) throw AppError.forbidden();
  await tripsRepo.addDestination(tripId, destination_id, visit_order);
};

const removeDestination = async (tripId, destId, userId) => {
  const trip = await tripsRepo.findById(tripId);
  if (!trip) throw AppError.notFound('Trip not found');
  if (trip.user_id !== userId) throw AppError.forbidden();
  await tripsRepo.removeDestination(tripId, destId);
};

const getTripDestinations = async (tripId, userId) => {
  const trip = await tripsRepo.findById(tripId);
  if (!trip) throw AppError.notFound('Trip not found');
  if (trip.privacy === 'private' && trip.user_id !== userId) throw AppError.forbidden();
  return tripsRepo.findDestinations(tripId);
};

module.exports = {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  addDestination,
  removeDestination,
  getTripDestinations,
};
