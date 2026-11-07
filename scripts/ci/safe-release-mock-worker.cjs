// Mock Passenger worker for safe-release E2E tests (local only).
// Resolves the release pointer once at startup, then serves that release.
const fs = require('fs');
const http = require('http');
const path = require('path');

const pointer = process.argv[2];
const appRoot = fs.realpathSync(pointer);
const handler = require(path.join(appRoot, 'app.cjs'));
const server = http.createServer((req, res) => {
    try {
        handler(req, res);
    } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: String(err && err.message) }));
    }
});
server.listen(0, '127.0.0.1', () => process.stdout.write(`PORT ${server.address().port}\n`));
process.on('SIGTERM', () => {
    // Graceful: finish in-flight requests, drop idle keep-alive sockets.
    server.close(() => process.exit(0));
    server.closeIdleConnections();
    setTimeout(() => process.exit(0), 2000).unref();
});
