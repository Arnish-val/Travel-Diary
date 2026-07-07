const fs = require('fs');
const path = require('path');

exports.up = (pgm) => {
  const sql = fs.readFileSync(path.join(__dirname, 'schema_social_sockets.sql'), 'utf8');
  pgm.sql(sql);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS notifications CASCADE;
    DROP TABLE IF EXISTS follows CASCADE;
  `);
};
