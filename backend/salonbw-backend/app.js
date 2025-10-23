const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT =
  process.env.PORT ||
  process.env.PASSENGER_PORT ||
  process.env.APP_PORT ||
  '3001';

const distRoot = path.join(__dirname, 'dist');
const candidates = [
  path.join(distRoot, 'main.js'),
  path.join(distRoot, 'src', 'main.js'),
  path.join(distRoot, 'main.cjs'),
  path.join(distRoot, 'src', 'main.cjs'),
];

const entry = candidates.find((candidate) => fs.existsSync(candidate));

if (!entry) {
  const listed = candidates.map((candidate) => path.relative(__dirname, candidate)).join(', ');
  throw new Error(
    `Unable to locate compiled backend entry point. Checked: ${listed}.`,
  );
}

require(entry);
