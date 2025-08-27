#!/usr/bin/env node

const { spawn } = require('child_process');
const { findAvailablePort, killProcessOnPort } = require('./server-utils');

async function startDevServer() {
  console.log('🚀 Starting development server...\n');
  
  // Try to clean up port 3000 first if it's occupied
  const preferredPort = 3000;
  
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
    
    // For automated scripts, just find next available port
    if (!process.stdin.isTTY) {
      const availablePort = await findAvailablePort(preferredPort);
      return startOnPort(availablePort);
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
          await new Promise(resolve => setTimeout(resolve, 1000));
          startOnPort(preferredPort);
          resolve();
        } else if (key.toLowerCase() === 'n') {
          const availablePort = await findAvailablePort(preferredPort + 1);
          startOnPort(availablePort);
          resolve();
        } else {
          console.log('\n👋 Exiting...');
          process.exit(0);
        }
      });
    });
  }
  
  startOnPort(preferredPort);
}

function startOnPort(port) {
  console.log(`\n📡 Starting Next.js on port ${port}...\n`);
  
  const env = { ...process.env, PORT: port };
  
  // If NEXT_PUBLIC_API_URL is not set, set it to a sensible default
  if (!env.NEXT_PUBLIC_API_URL) {
    env.NEXT_PUBLIC_API_URL = 'http://localhost:3001'; // Assuming backend runs on 3001
  }
  
  const child = spawn('npx', ['next', 'dev'], {
    env,
    stdio: 'inherit',
    shell: true
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
