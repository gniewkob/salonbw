const { Client } = require("pg");
const { config: loadEnv } = require("dotenv");

loadEnv({ path: process.env.DOTENV_CONFIG_PATH || "backend/salonbw-backend/.env" });

const ssl = process.env.PGSSL === "1" ? true : false;
const config = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl }
    : {
          // Tunnel maps remote 5432 to local 8543
          host: process.env.DB_HOST || process.env.PGHOST || "localhost",
          port: Number(process.env.DB_PORT || process.env.PGPORT || 8543),
          user: process.env.DB_USER || process.env.PGUSER,
          password: process.env.DB_PASS || process.env.PGPASSWORD,
          database: process.env.DB_NAME || process.env.PGDATABASE,
          ssl,
      };

if (!config.connectionString) {
    const missing = [];
    if (!config.user) missing.push("DB_USER/PGUSER");
    if (!config.password) missing.push("DB_PASS/PGPASSWORD");
    if (!config.database) missing.push("DB_NAME/PGDATABASE");
    if (missing.length > 0) {
        console.error("Missing DB env vars:", missing.join(", "));
        process.exit(1);
    }
}

console.log("Connecting with config:", {
    ...config,
    password: config.password ? "***" : undefined,
    connectionString: config.connectionString ? "***" : undefined,
});

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
