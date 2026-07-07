'use strict';
const tripsService = require('./trips.service');
const asyncHandler = require('../../utils/asyncHandler');
const { parseCursorPagination } = require('../../utils/pagination');

const getTrips = asyncHandler(async (req, res) => {
  const { limit, cursor } = parseCursorPagination(req.query);
  const sort = req.query.sort || 'newest';
  const result = await tripsService.getTrips(req.user.id, { limit, cursor, sort });
  res.json({ status: 'success', ...result });
});

const getTrip = asyncHandler(async (req, res) => {
  const trip = await tripsService.getTripById(req.params.id, req.user?.id);
  res.json({ status: 'success', data: { trip } });
});

const createTrip = asyncHandler(async (req, res) => {
  const trip = await tripsService.createTrip(req.user.id, req.body);
  res.status(201).json({ status: 'success', data: { trip } });
});

const updateTrip = asyncHandler(async (req, res) => {
  const trip = await tripsService.updateTrip(req.params.id, req.user.id, req.body);
  res.json({ status: 'success', data: { trip } });
});

const deleteTrip = asyncHandler(async (req, res) => {
  await tripsService.deleteTrip(req.params.id, req.user.id);
  res.status(204).send();
});

const getDestinations = asyncHandler(async (req, res) => {
  const destinations = await tripsService.getTripDestinations(req.params.id, req.user.id);
  res.json({ status: 'success', data: { destinations } });
});

const addDestination = asyncHandler(async (req, res) => {
  await tripsService.addDestination(req.params.id, req.user.id, req.body);
  res.status(201).json({ status: 'success', message: 'Destination added' });
});

const removeDestination = asyncHandler(async (req, res) => {
  await tripsService.removeDestination(req.params.id, req.params.destId, req.user.id);
  res.status(204).send();
});

module.exports = {
  getTrips, getTrip, createTrip, updateTrip, deleteTrip,
  getDestinations, addDestination, removeDestination,
};
