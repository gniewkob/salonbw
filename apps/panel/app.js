const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

// Verify we are in the correct directory (optional logging)
// try {
//   const fs = require('fs');
//   fs.appendFileSync('public/passenger_boot.log', `Booting at ${new Date().toISOString()} in ${process.cwd()}\n`);
// } catch (e) {}

const dev = process.env.NODE_ENV !== 'production';
const dir = __dirname; // App is in the root of the bundled directory
const app = next({ dev, dir });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare()
    .then(() => {
        createServer((req, res) => {
            const parsedUrl = parse(req.url, true);
            handle(req, res, parsedUrl);
        }).listen(port, (err) => {
            if (err) throw err;
            console.log(`> Ready on http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error('Error starting Next.js app:', err);
        // Attempt to log to file if console capture fails
        try {
            const fs = require('fs');
            fs.appendFileSync(
                path.join(__dirname, 'public', 'startup_error.log'),
                `Startup Error: ${err.message}\n${err.stack}\n`,
            );
        } catch (e) {}
        process.exit(1);
    });
