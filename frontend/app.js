const path = require('path');
const fs = require('fs');
const http = require('http');

// Global error handler to report errors via HTTP if possible
function reportStartupError(err) {
    console.error('CRITICAL STARTUP ERROR:', err);
    const port = process.env.PORT || process.env.PASSENGER_PORT || '3000';
    try {
        const server = http.createServer((req, res) => {
            res.writeHead(500, {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*',
            });
            res.end(
                `Application Failed to Start\n\nError: ${err.message}\nStack: ${err.stack}\n\nEnvironment:\n${JSON.stringify(process.env, null, 2)}`,
            );
        });
        server.listen(port, () => {
            console.log(`Diagnostic server running on port ${port}`);
        });
    } catch (e) {
        process.exit(1);
    }
}

try {
    // Load environment from .env files
    function loadDotEnvFiles() {
        const files = ['.env.production', '.env.local', '.env'];
        for (const file of files) {
            const filePath = path.join(__dirname, file);
            try {
                if (!fs.existsSync(filePath)) continue;
                console.log(`Loading env from ${file}`);
                const content = fs.readFileSync(filePath, 'utf8');
                for (const line of content.split('\n')) {
                    if (!line || line.trim().startsWith('#')) continue;
                    const idx = line.indexOf('=');
                    if (idx === -1) continue;
                    const key = line.slice(0, idx).trim();
                    const valueRaw = line.slice(idx + 1).trim();
                    const value = valueRaw.replace(/^["']|["']$/g, '');
                    if (!(key in process.env)) {
                        process.env[key] = value;
                    }
                }
            } catch {}
        }
    }

    loadDotEnvFiles();

    // Ensure basic env vars
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    process.env.PORT = process.env.PORT || process.env.PASSENGER_PORT || '3000';

    // Standalone Next.js expects these to be present in its search path
    // With our new layout, node_modules should be in __dirname
    const serverFile = path.join(__dirname, 'server.js');

    if (!fs.existsSync(serverFile)) {
        // Fallback for nested standalone structure if cleanup missed it
        const fallbackServer = path.join(
            __dirname,
            '.next',
            'standalone',
            'server.js',
        );
        if (fs.existsSync(fallbackServer)) {
            console.log('Falling back to nested standalone server');
            require(fallbackServer);
        } else {
            throw new Error(
                `Missing server.js at ${serverFile}. Ensure standalone build is correct.`,
            );
        }
    } else {
        console.log('Starting standalone server from', serverFile);
        require(serverFile);
    }
} catch (err) {
    reportStartupError(err);
}
