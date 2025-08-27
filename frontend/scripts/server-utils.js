#!/usr/bin/env node

const { execSync } = require('child_process');
const net = require('net');

/**
 * Check if a port is in use
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} - True if port is in use
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Find an available port starting from the given port
 * @param {number} startPort - Starting port number
 * @param {number} maxAttempts - Maximum number of ports to try
 * @returns {Promise<number>} - Available port number
 */
async function findAvailablePort(startPort = 3000, maxAttempts = 10) {
  let port = startPort;
  
  for (let i = 0; i < maxAttempts; i++) {
    const inUse = await isPortInUse(port);
    if (!inUse) {
      return port;
    }
    console.log(`Port ${port} is in use, trying ${port + 1}...`);
    port++;
  }
  
  throw new Error(`Could not find available port after ${maxAttempts} attempts`);
}

/**
 * Kill process using a specific port
 * @param {number} port - Port number
 * @returns {boolean} - True if process was killed
 */
function killProcessOnPort(port) {
  try {
    // Get PID of process using the port
    const pid = execSync(`lsof -ti:${port} 2>/dev/null || true`).toString().trim();
    
    if (pid) {
      console.log(`Killing process ${pid} on port ${port}...`);
      execSync(`kill -9 ${pid} 2>/dev/null || true`);
      
      // Wait a bit for the process to die
      execSync('sleep 1');
      return true;
    }
  } catch (error) {
    // Ignore errors, port might not be in use
  }
  return false;
}

/**
 * Clean up common development ports
 * @param {number[]} ports - Array of port numbers to clean
 */
function cleanupPorts(ports = [3000, 3001, 3002, 3003]) {
  console.log('Cleaning up ports:', ports.join(', '));
  
  ports.forEach(port => {
    if (killProcessOnPort(port)) {
      console.log(`✓ Cleaned port ${port}`);
    }
  });
}

/**
 * Start server with automatic port selection
 * @param {string} command - Command to start the server
 * @param {number} preferredPort - Preferred port number
 * @returns {Promise<{port: number, command: string}>}
 */
async function startServerWithAvailablePort(command = 'npm run dev', preferredPort = 3000) {
  const port = await findAvailablePort(preferredPort);
  const fullCommand = `PORT=${port} ${command}`;
  
  console.log(`Starting server on port ${port}...`);
  console.log(`Command: ${fullCommand}`);
  
  return { port, command: fullCommand };
}

// Export functions for use in other scripts
module.exports = {
  isPortInUse,
  findAvailablePort,
  killProcessOnPort,
  cleanupPorts,
  startServerWithAvailablePort
};

// If running directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'cleanup':
      cleanupPorts();
      break;
      
    case 'find-port':
      findAvailablePort().then(port => {
        console.log(`Available port: ${port}`);
      });
      break;
      
    case 'kill':
      const port = parseInt(args[1]) || 3000;
      if (killProcessOnPort(port)) {
        console.log(`Killed process on port ${port}`);
      } else {
        console.log(`No process found on port ${port}`);
      }
      break;
      
    default:
      console.log('Usage:');
      console.log('  node server-utils.js cleanup     - Clean up common ports');
      console.log('  node server-utils.js find-port   - Find available port');
      console.log('  node server-utils.js kill [port] - Kill process on specific port');
  }
}
