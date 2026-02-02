try {
    const tracer = require('next/dist/server/lib/trace/tracer');
    if (tracer && typeof tracer.getTracer === 'function') {
        const originalGetTracer = tracer.getTracer;
        tracer.getTracer = () => {
            const instance = originalGetTracer();
            if (
                instance &&
                typeof instance.setRootSpanAttribute !== 'function'
            ) {
                instance.setRootSpanAttribute = () => {};
            }
            return instance;
        };
    }
} catch (err) {
    console.warn('Tracer patch skipped:', err?.message || err);
}

const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const currentPort = Number(
    process.env.PORT ||
        process.env.PASSENGER_PORT ||
        process.env.APP_PORT ||
        3000,
);

const dataBase = path.join(__dirname, '.next', 'data');

function tryServeNextData(req, res, pathname) {
    if (!pathname || !pathname.startsWith('/_next/data/')) return false;
    const relative = pathname.replace(/^\/\/_next\/data\//, '');
    const dataPath = path.join(dataBase, relative);
    if (!dataPath.startsWith(dataBase + path.sep)) {
        res.statusCode = 400;
        res.end('Bad request');
        return true;
    }
    if (!fs.existsSync(dataPath)) return false;
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method === 'HEAD') {
        res.end();
        return true;
    }
    res.end(fs.readFileSync(dataPath));
    return true;
}

// Initialize Next.js app
const app = next({ dev, hostname, port: currentPort, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            if (tryServeNextData(req, res, parsedUrl.pathname)) {
                return;
            }
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    })
        .once('error', (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(currentPort, () => {
            console.log(`> Ready on http://${hostname}:${currentPort}`);
        });
});
