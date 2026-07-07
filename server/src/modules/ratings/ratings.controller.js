'use strict';
const ratingsService = require('./ratings.service');
const asyncHandler = require('../../utils/asyncHandler');
const { validateBody } = require('../../middleware/validate');
const Joi = require('joi');

const ratingSchema = Joi.object({
  score: Joi.number().integer().min(1).max(5).required(),
  review: Joi.string().max(2000).trim().allow('').optional(),
  tagIds: Joi.array().items(Joi.number().integer()).optional(),
});

const getForDestination = asyncHandler(async (req, res) => {
  const result = await ratingsService.getForDestination(req.params.destId);
  res.json({ status: 'success', data: result });
});

const createRating = [
  validateBody(ratingSchema),
  asyncHandler(async (req, res) => {
    const rating = await ratingsService.createRating(
      req.user.id,
      req.params.destId,
      req.body
    );
    res.status(201).json({ status: 'success', data: { rating } });
  }),
];

const updateRating = asyncHandler(async (req, res) => {
  const rating = await ratingsService.updateRating(req.params.id, req.user.id, req.body);
  res.json({ status: 'success', data: { rating } });
});

const deleteRating = asyncHandler(async (req, res) => {
  await ratingsService.deleteRating(req.params.id, req.user.id);
  res.status(204).send();
});

module.exports = { getForDestination, createRating, updateRating, deleteRating };
