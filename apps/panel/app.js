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

// Initialize Next.js app
const app = next({ dev, hostname, port: currentPort, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    createServer(async (req, res) => {
        try {
            // Be sure to pass `true` as the second argument to `url.parse`.
            // This tells it to parse the query portion of the URL.
            const parsedUrl = parse(req.url, true);

            // Handle request
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
