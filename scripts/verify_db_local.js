const { Client } = require("pg");

const config = {
    // Tunnel maps remote 5432 to local 8543
    host: "localhost",
    port: 8543,
    user: process.env.DB_USER,
    password: "a0_JXJAw-L_{a4jYjBxr-1N_Yj5cvT",
    database: process.env.DB_NAME,
    ssl: false,
};

console.log("Connecting with config:", { ...config, password: "***" });

const client = new Client(config);

(async () => {
    try {
        await client.connect();
        const res = await client.query(
            "SELECT current_user, current_database()"
        );
        console.log("Connected successfully!");
        console.log("User:", res.rows[0].current_user);
        console.log("Database:", res.rows[0].current_database);
        await client.end();
        process.exit(0);
    } catch (err) {
        console.error("Connection failed:", err.message);
        process.exit(1);
    }
})();
