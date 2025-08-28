#!/usr/bin/env node

const { spawn } = require('child_process');
const { findAvailablePort, killProcessOnPort } = require('./server-utils');
const fs = require('fs');
const path = require('path');

/**
 * Load environment variables from .env.local or .env
 */
function loadEnvFile() {
    const envFiles = ['.env.local', '.env'];
    const env = {};

    for (const file of envFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');

            lines.forEach((line) => {
                // Skip comments and empty lines
                if (!line || line.startsWith('#')) return;

                const [key, ...valueParts] = line.split('=');
                if (key) {
                    const value = valueParts.join('=').trim();
                    // Remove quotes if present
                    env[key.trim()] = value.replace(/^["']|["']$/g, '');
                }
            });
        }
    }

    return env;
}

async function startDevServer() {
    console.log('🚀 Starting development server...\n');

    // Load environment variables
    const envVars = loadEnvFile();

    // Check if PORT is defined in environment
    const envPort = process.env.PORT || envVars.PORT;
    const preferredPort = envPort ? parseInt(envPort) : 3000;

    if (envPort) {
        console.log(
            `📌 Using port ${preferredPort} from environment configuration`,
        );
    }

    try {
        // Check if port 3000 is in use
        const port = await findAvailablePort(preferredPort, 1);

        if (port === preferredPort) {
            console.log(`✅ Port ${preferredPort} is available`);
        }
    } catch {
        console.log(`⚠️  Port ${preferredPort} is in use`);
        console.log('Options:');
        console.log('1. Kill the process and use port 3000 (press K)');
        console.log('2. Find next available port (press N)');
        console.log('3. Exit (press any other key)');

        // For automated scripts or if PORT is fixed in env, just find next available port
        if (!process.stdin.isTTY || envPort) {
            const availablePort = await findAvailablePort(preferredPort);
            return startOnPort(availablePort, envVars);
        }

        // Interactive mode
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');

        return new Promise((resolve) => {
            process.stdin.once('data', async (key) => {
                process.stdin.setRawMode(false);
                process.stdin.pause();

                if (key.toLowerCase() === 'k') {
                    console.log('\n🔪 Killing process on port 3000...');
                    killProcessOnPort(preferredPort);
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    startOnPort(preferredPort, envVars);
                    resolve();
                } else if (key.toLowerCase() === 'n') {
                    const availablePort = await findAvailablePort(
                        preferredPort + 1,
                    );
                    startOnPort(availablePort, envVars);
                    resolve();
                } else {
                    console.log('\n👋 Exiting...');
                    process.exit(0);
                }
            });
        });
    }

    startOnPort(preferredPort, envVars);
}

function startOnPort(port, envVars = {}) {
    console.log(`\n📡 Starting Next.js on port ${port}...\n`);

    // Merge environment variables: process.env < .env file < command line
    const env = {
        ...process.env,
        ...envVars,
        PORT: port,
    };

    // If NEXT_PUBLIC_API_URL is not set, check .env files, then use default
    if (!env.NEXT_PUBLIC_API_URL) {
        env.NEXT_PUBLIC_API_URL =
            envVars.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    }

    console.log(`🔗 API URL: ${env.NEXT_PUBLIC_API_URL}`);

    // Show if we're in production mode
    if (env.NODE_ENV === 'production') {
        console.log('⚠️  Running in PRODUCTION mode');
    }

    const child = spawn('npx', ['next', 'dev'], {
        env,
        stdio: 'inherit',
        shell: true,
    });

    // Handle cleanup on exit
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Shutting down server...');
        child.kill('SIGTERM');
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        child.kill('SIGTERM');
        process.exit(0);
    });

    child.on('error', (error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });

    child.on('exit', (code) => {
        if (code !== null && code !== 0) {
            console.error(`Server exited with code ${code}`);
        }
        process.exit(code);
    });
}

// Run if called directly
if (require.main === module) {
    startDevServer().catch(console.error);
}
