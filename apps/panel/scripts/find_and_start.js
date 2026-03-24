const { findAvailablePort } = require('./server-utils');
const { spawn } = require('child_process');

async function findAndStart() {
    const port = await findAvailablePort(3000);
    console.log(`Found available port: ${port}`);

    const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const child = spawn(npx, ['next', 'dev', '-p', port], {
        stdio: 'inherit',
        shell: false,
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

findAndStart();
