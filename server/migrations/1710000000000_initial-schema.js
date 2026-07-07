const fs = require('fs');
const path = require('path');

exports.up = (pgm) => {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  pgm.sql(sql);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS recommendations CASCADE;
    DROP TABLE IF EXISTS checklist_items CASCADE;
    DROP TABLE IF EXISTS planned_trip_destinations CASCADE;
    DROP TABLE IF EXISTS planned_trips CASCADE;
    DROP TABLE IF EXISTS rating_tags CASCADE;
    DROP TABLE IF EXISTS ratings CASCADE;
    DROP TABLE IF EXISTS tags CASCADE;
    DROP TABLE IF EXISTS media CASCADE;
    DROP TABLE IF EXISTS trip_destinations CASCADE;
    DROP TABLE IF EXISTS trips CASCADE;
    DROP TABLE IF EXISTS destinations CASCADE;
    DROP TABLE IF EXISTS refresh_tokens CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);
};
