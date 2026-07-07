'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('../config/db');
const logger = require('../config/logger');

const TAGS = [
  { name: 'food', category: 'experience' },
  { name: 'scenery', category: 'environment' },
  { name: 'culture', category: 'experience' },
  { name: 'nightlife', category: 'experience' },
  { name: 'adventure', category: 'activity' },
  { name: 'budget-friendliness', category: 'practical' },
  { name: 'relaxation', category: 'activity' },
  { name: 'history', category: 'experience' },
  { name: 'wildlife', category: 'environment' },
  { name: 'beaches', category: 'environment' },
  { name: 'shopping', category: 'activity' },
  { name: 'family-friendly', category: 'practical' },
];

const SAMPLE_DESTINATIONS = [
  { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, description: 'The City of Light, known for the Eiffel Tower, world-class cuisine, and art.' },
  { name: 'Bali', country: 'Indonesia', latitude: -8.3405, longitude: 115.0920, description: 'Island paradise with temples, rice terraces, and stunning beaches.' },
  { name: 'Kyoto', country: 'Japan', latitude: 35.0116, longitude: 135.7681, description: 'Ancient capital with thousands of temples, shrines, and traditional culture.' },
  { name: 'Santorini', country: 'Greece', latitude: 36.3932, longitude: 25.4615, description: 'Iconic white-washed buildings overlooking the Aegean Sea.' },
  { name: 'New York City', country: 'USA', latitude: 40.7128, longitude: -74.0060, description: 'The Big Apple — Times Square, Central Park, world-class museums.' },
  { name: 'Machu Picchu', country: 'Peru', latitude: -13.1631, longitude: -72.5450, description: '15th-century Inca citadel set high in the Andes Mountains.' },
  { name: 'Cape Town', country: 'South Africa', latitude: -33.9249, longitude: 18.4241, description: 'Dramatic scenery with Table Mountain, beaches, and vibrant culture.' },
  { name: 'Amsterdam', country: 'Netherlands', latitude: 52.3676, longitude: 4.9041, description: 'City of canals, bicycles, world-class museums, and tulip fields.' },
  { name: 'Barcelona', country: 'Spain', latitude: 41.3851, longitude: 2.1734, description: 'Gaudí architecture, La Rambla, and Mediterranean beaches.' },
  { name: 'Dubai', country: 'UAE', latitude: 25.2048, longitude: 55.2708, description: 'Ultramodern architecture, luxury shopping, and desert adventures.' },
];

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    logger.info('Seeding tags...');
    for (const tag of TAGS) {
      await client.query(
        `INSERT INTO tags (name, category) VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET category = $2`,
        [tag.name, tag.category]
      );
    }

    logger.info('Seeding sample destinations...');
    for (const dest of SAMPLE_DESTINATIONS) {
      await client.query(
        `INSERT INTO destinations (name, country, latitude, longitude, description)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name, country) DO NOTHING`,
        [dest.name, dest.country, dest.latitude, dest.longitude, dest.description]
      );
    }

    await client.query('COMMIT');
    logger.info('Seeding complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'Seeding failed');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed().catch(() => process.exit(1));
