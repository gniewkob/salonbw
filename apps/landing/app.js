const fs = require('fs');
const path = require('path');
const diagnostics = path.join(__dirname, '.diagnostics');
fs.mkdirSync(diagnostics, { recursive: true, mode: 0o700 });
const logFile = path.join(diagnostics, 'startup.log');

function log(msg) {
    const time = new Date().toISOString();
    fs.appendFileSync(logFile, `[${time}] ${msg}\n`, { mode: 0o600 });
    console.log(msg);
}

try {
    log('--- Application Startup (app.js) ---');
    log('Node version: ' + process.version);
    log('Current dir: ' + __dirname);
    log('Env PORT: ' + process.env.PORT);

    // Delegate to the full bootstrap (standalone sync + asset linking).
    require('./app.cjs');
} catch (err) {
    log('FATAL ERROR DURING REQUIRE: ' + err.message);
    log('Stack: ' + err.stack);

    // Fallback to minimal HTTP server to report error if Passenger didn't kill it.
    try {
        const http = require('http');
        const port = process.env.PORT || 3000;
        const server = http.createServer((req, res) => {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Application startup failed');
        });
        server.listen(port);
    } catch (e) {}

    process.exit(1);
}