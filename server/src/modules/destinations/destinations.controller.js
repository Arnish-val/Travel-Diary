'use strict';
const destinationsService = require('./destinations.service');
const asyncHandler = require('../../utils/asyncHandler');
const { parseOffsetPagination } = require('../../utils/pagination');

const search = asyncHandler(async (req, res) => {
  const { limit, offset, page } = parseOffsetPagination(req.query);
  const { q, tags, minRating } = req.query;
  const tagArr = tags ? tags.split(',').map(Number).filter(Boolean) : [];
  const result = await destinationsService.searchDestinations({ q, tags: tagArr, minRating, limit, page });
  res.json({ status: 'success', ...result });
});

const getById = asyncHandler(async (req, res) => {
  const dest = await destinationsService.getDestinationById(req.params.id);
  res.json({ status: 'success', data: { destination: dest } });
});

const create = asyncHandler(async (req, res) => {
  const dest = await destinationsService.createDestination(req.body);
  res.status(201).json({ status: 'success', data: { destination: dest } });
});

const autocomplete = asyncHandler(async (req, res) => {
  const results = await destinationsService.autocomplete(req.query.q);
  res.json({ status: 'success', data: { results } });
});

module.exports = { search, getById, create, autocomplete };
