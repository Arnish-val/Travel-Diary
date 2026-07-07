'use strict';
const destinationsRepo = require('./destinations.repository');
const AppError = require('../../utils/AppError');
const { buildPaginationMeta } = require('../../utils/pagination');

const searchDestinations = async (queryParams) => {
  const { q, tags, minRating, limit = 20, page = 1 } = queryParams;
  const offset = (page - 1) * limit;
  const { items, total } = await destinationsRepo.search({ q, tags, minRating, limit, offset });
  return { items, meta: buildPaginationMeta({ total, page, limit }) };
};

const getDestinationById = async (id) => {
  const dest = await destinationsRepo.findById(id);
  if (!dest) throw AppError.notFound('Destination not found');
  return dest;
};

const createDestination = async (data) => {
  return destinationsRepo.create(data);
};

const autocomplete = async (q) => {
  if (!q || q.length < 2) return [];
  return destinationsRepo.autocomplete(q);
};

module.exports = { searchDestinations, getDestinationById, createDestination, autocomplete };
