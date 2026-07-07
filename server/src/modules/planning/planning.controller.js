'use strict';
const planningService = require('./planning.service');
const asyncHandler = require('../../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const items = await planningService.getPlannedTrips(req.user.id);
  res.json({ status: 'success', data: { items } });
});

const getById = asyncHandler(async (req, res) => {
  const trip = await planningService.getPlannedTripById(req.params.id, req.user.id);
  res.json({ status: 'success', data: { trip } });
});

const create = asyncHandler(async (req, res) => {
  const trip = await planningService.createPlannedTrip(req.user.id, req.body);
  res.status(201).json({ status: 'success', data: { trip } });
});

const update = asyncHandler(async (req, res) => {
  const trip = await planningService.updatePlannedTrip(req.params.id, req.user.id, req.body);
  res.json({ status: 'success', data: { trip } });
});

const remove = asyncHandler(async (req, res) => {
  await planningService.deletePlannedTrip(req.params.id, req.user.id);
  res.status(204).send();
});

const addItem = asyncHandler(async (req, res) => {
  const item = await planningService.addChecklistItem(req.params.id, req.user.id, req.body);
  res.status(201).json({ status: 'success', data: { item } });
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await planningService.updateChecklistItem(
    req.params.id, req.params.itemId, req.user.id, req.body
  );
  res.json({ status: 'success', data: { item } });
});

const removeItem = asyncHandler(async (req, res) => {
  await planningService.deleteChecklistItem(req.params.id, req.params.itemId, req.user.id);
  res.status(204).send();
});

module.exports = { getAll, getById, create, update, remove, addItem, updateItem, removeItem };
