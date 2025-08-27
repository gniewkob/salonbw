#!/usr/bin/env node

/**
 * Production server starter
 * This script is designed for production environments where configuration
 * is strictly controlled via environment variables
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Load environment variables from .env.production or .env
 * Priority: process.env > .env.production > .env.local > .env
 */
function loadProductionEnv() {
  const envFiles = ['.env.production', '.env.local', '.env'];
  const env = {};
  
  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`📄 Loading configuration from ${file}`);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach(line => {
        // Skip comments and empty lines
        if (!line || line.startsWith('#')) return;
        
        const [key, ...valueParts] = line.split('=');
        if (key && !env[key.trim()]) { // Don't override already set values
          const value = valueParts.join('=').trim();
          // Remove quotes if present
          env[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      });
    }
  }
  
  return env;
}

function validateConfiguration(env) {
  const errors = [];
  
  // Check required variables
  if (!env.NEXT_PUBLIC_API_URL) {
    errors.push('NEXT_PUBLIC_API_URL is not set');
  }
  
  // Validate PORT if set
  if (env.PORT) {
    const port = parseInt(env.PORT);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push(`Invalid PORT value: ${env.PORT}`);
    }
  }
  
  // Warn about development settings in production
  if (env.NODE_ENV === 'production') {
    if (env.NEXT_PUBLIC_ENABLE_DEBUG === 'true') {
      console.warn('⚠️  Warning: Debug mode is enabled in production');
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
}

function startProductionServer() {
  console.log('🚀 Starting production server...\n');
  
  // Load environment configuration
  const fileEnv = loadProductionEnv();
  
  // Merge with process.env (process.env takes precedence)
  const env = {
    ...fileEnv,
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production'
  };
  
  // Validate configuration
  validateConfiguration(env);
  
  const port = env.PORT || 3000;
  
  console.log('📋 Configuration:');
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Port: ${port}`);
  console.log(`   API URL: ${env.NEXT_PUBLIC_API_URL}`);
  
  if (env.NEXT_PUBLIC_SITE_URL) {
    console.log(`   Site URL: ${env.NEXT_PUBLIC_SITE_URL}`);
  }
  
  console.log('\n📡 Starting Next.js production server...\n');
  
  // Check if build exists
  if (!fs.existsSync(path.join(process.cwd(), '.next'))) {
    console.error('❌ Production build not found. Please run "npm run build" first.');
    process.exit(1);
  }
  
  const child = spawn('npx', ['next', 'start', '-p', port], {
    env,
    stdio: 'inherit',
    shell: true
  });
  
  // Handle graceful shutdown
  const shutdown = () => {
    console.log('\n\n🛑 Shutting down production server gracefully...');
    child.kill('SIGTERM');
    
    // Force kill after 10 seconds if not shut down
    setTimeout(() => {
      console.log('⚠️  Force killing server...');
      child.kill('SIGKILL');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  child.on('error', (error) => {
    console.error('Failed to start production server:', error);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`Production server exited with code ${code}`);
    }
    process.exit(code || 0);
  });
}

// Run if called directly
if (require.main === module) {
  startProductionServer();
}
