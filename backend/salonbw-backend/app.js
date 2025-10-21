process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT =
  process.env.PORT ||
  process.env.PASSENGER_PORT ||
  process.env.APP_PORT ||
  '3001';

require('./dist/main.js');

