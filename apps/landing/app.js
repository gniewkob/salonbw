const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, 'public', 'diagnostic_logs.txt');

function log(msg) {
    const time = new Date().toISOString();
    fs.appendFileSync(logFile, `[${time}] ${msg}\n`);
    console.log(msg);
}

try {
    // Re-initialize the file or append? Let's append but start with a clear separator
    log('--- Application Startup (app.js) ---');
    log('Node version: ' + process.version);
    log('Current dir: ' + __dirname);
    log('Env PORT: ' + process.env.PORT);
    log('All Env: ' + JSON.stringify(process.env, null, 2));

    const serverPath = path.join(__dirname, '.next', 'standalone', 'server.js');
    if (!fs.existsSync(serverPath)) {
        throw new Error(`Missing standalone server at ${serverPath}`);
    }
    log('Standalone server: ' + serverPath);
    require(serverPath);
} catch (err) {
    log('FATAL ERROR DURING REQUIRE: ' + err.message);
    log('Stack: ' + err.stack);

    // Fallback to minimal HTTP server to report error if Passenger didn't kill it
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
