const { Client } = require('pg');

const config = {
    host: '127.0.0.1',
    port: 8543,
    user: 'p11522_salonbw',
    password: 'Nqx#61ty2i&+_tuqmMeNLq+j]XO32R',
    database: 'p11522_salonbw',
};

console.log('Testing connection with config:', { ...config, password: '***' });

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
