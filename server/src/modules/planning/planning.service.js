'use strict';
const planningRepo = require('./planning.repository');
const AppError = require('../../utils/AppError');

const getPlannedTrips = async (userId) => planningRepo.findByUserId(userId);

const getPlannedTripById = async (id, userId) => {
  const trip = await planningRepo.findById(id);
  if (!trip) throw AppError.notFound('Planned trip not found');
  if (trip.user_id !== userId) throw AppError.forbidden();
  return trip;
};

const createPlannedTrip = async (userId, body) => planningRepo.create(userId, body);

const updatePlannedTrip = async (id, userId, body) => {
  const existing = await planningRepo.findById(id);
  if (!existing) throw AppError.notFound('Planned trip not found');
  if (existing.user_id !== userId) throw AppError.forbidden();
  return planningRepo.update(id, userId, body);
};

const deletePlannedTrip = async (id, userId) => {
  const deleted = await planningRepo.deleteById(id, userId);
  if (!deleted) throw AppError.notFound('Planned trip not found');
};

const addChecklistItem = async (plannedTripId, userId, body) => {
  const trip = await planningRepo.findById(plannedTripId);
  if (!trip) throw AppError.notFound('Planned trip not found');
  if (trip.user_id !== userId) throw AppError.forbidden();
  return planningRepo.addChecklistItem(plannedTripId, body);
};

const updateChecklistItem = async (plannedTripId, itemId, userId, body) => {
  const trip = await planningRepo.findById(plannedTripId);
  if (!trip) throw AppError.notFound('Planned trip not found');
  if (trip.user_id !== userId) throw AppError.forbidden();
  const item = await planningRepo.updateChecklistItem(itemId, plannedTripId, body);
  if (!item) throw AppError.notFound('Checklist item not found');
  return item;
};

const deleteChecklistItem = async (plannedTripId, itemId, userId) => {
  const trip = await planningRepo.findById(plannedTripId);
  if (!trip) throw AppError.notFound('Planned trip not found');
  if (trip.user_id !== userId) throw AppError.forbidden();
  await planningRepo.deleteChecklistItem(itemId, plannedTripId);
};

module.exports = {
  getPlannedTrips, getPlannedTripById, createPlannedTrip, updatePlannedTrip,
  deletePlannedTrip, addChecklistItem, updateChecklistItem, deleteChecklistItem,
};
