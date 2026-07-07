'use strict';
const { Router } = require('express');
const controller = require('./trips.controller');
const { authenticate, optionalAuthenticate } = require('../../middleware/auth.middleware');
const { validateBody, validateQuery } = require('../../middleware/validate');
const {
  createTripSchema,
  updateTripSchema,
  addDestinationSchema,
  tripsQuerySchema,
} = require('./trips.validation');

const router = Router();

router.get('/', authenticate, validateQuery(tripsQuerySchema), controller.getTrips);
router.post('/', authenticate, validateBody(createTripSchema), controller.createTrip);

router.get('/:id', optionalAuthenticate, controller.getTrip);
router.patch('/:id', authenticate, validateBody(updateTripSchema), controller.updateTrip);
router.delete('/:id', authenticate, controller.deleteTrip);

router.get('/:id/destinations', optionalAuthenticate, controller.getDestinations);
router.post('/:id/destinations', authenticate, validateBody(addDestinationSchema), controller.addDestination);
router.delete('/:id/destinations/:destId', authenticate, controller.removeDestination);

module.exports = router;
