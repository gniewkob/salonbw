const { Client } = require('pg');
const { config: loadEnv } = require('dotenv');

loadEnv();

const ssl = process.env.PGSSL === '1' ? true : false;
const config = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl }
    : {
          host: process.env.PGHOST || process.env.DB_HOST || '127.0.0.1',
          port: Number(process.env.PGPORT || process.env.DB_PORT || 8543),
          user: process.env.PGUSER || process.env.DB_USER,
          password: process.env.PGPASSWORD || process.env.DB_PASS,
          database: process.env.PGDATABASE || process.env.DB_NAME,
          ssl,
      };

if (!config.connectionString) {
    const missing = [];
    if (!config.user) missing.push('PGUSER/DB_USER');
    if (!config.password) missing.push('PGPASSWORD/DB_PASS');
    if (!config.database) missing.push('PGDATABASE/DB_NAME');
    if (missing.length > 0) {
        console.error('Missing DB env vars:', missing.join(', '));
        process.exit(1);
    }
}

console.log('Testing connection with config:', {
    ...config,
    password: config.password ? '***' : undefined,
    connectionString: config.connectionString ? '***' : undefined,
});

const client = new Client(config);

client
    .connect()
    .then(() => {
        console.log('✅ Connected successfully!');
        return client.query('SELECT 1 as ok');
    })
    .then((res) => {
        console.log('Query result:', res.rows[0]);
        client.end();
        process.exit(0);
    })
    .catch((e) => {
        console.error('❌ Connection failed:', e);
        client.end();
        process.exit(1);
    });
