const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, 'public', 'diagnostic_logs.txt');

function log(msg) {
    const time = new Date().toISOString();
    fs.appendFileSync(logFile, `[${time}] ${msg}\n`);
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
            res.end('Startup Error:\n' + err.stack);
        });
        server.listen(port);
    } catch (e) {}

    process.exit(1);
}
