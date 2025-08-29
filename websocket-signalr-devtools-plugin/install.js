#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Installing WebSocket & SignalR DevTools Plugin...\n');

// Install main dependencies
console.log('📦 Installing main dependencies...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Main dependencies installed successfully\n');
} catch (error) {
  console.error('❌ Failed to install main dependencies:', error.message);
  process.exit(1);
}

// Install WebSocket example dependencies
const websocketExamplePath = path.join(__dirname, 'example', 'websocket-app');
if (fs.existsSync(websocketExamplePath)) {
  console.log('📦 Installing WebSocket example dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: websocketExamplePath });
    console.log('✅ WebSocket example dependencies installed successfully\n');
  } catch (error) {
    console.warn('⚠️ Failed to install WebSocket example dependencies:', error.message);
  }
}

// Install SignalR example dependencies
const signalrExamplePath = path.join(__dirname, 'example', 'signalr-app');
if (fs.existsSync(signalrExamplePath)) {
  console.log('📦 Installing SignalR example dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: signalrExamplePath });
    console.log('✅ SignalR example dependencies installed successfully\n');
  } catch (error) {
    console.warn('⚠️ Failed to install SignalR example dependencies:', error.message);
  }
}

// Build the project
console.log('🔨 Building the project...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Project built successfully\n');
} catch (error) {
  console.error('❌ Failed to build project:', error.message);
  console.log('You can manually run "npm run build" later\n');
}

// Run tests
console.log('🧪 Running tests...');
try {
  execSync('npm run test', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ All tests passed\n');
} catch (error) {
  console.warn('⚠️ Some tests failed:', error.message);
  console.log('You can manually run "npm run test" to check test status\n');
}

console.log('🎉 Installation complete!\n');
console.log('📚 Next steps:');
console.log('   • Run "npm run example:websocket" to start WebSocket example');
console.log('   • Run "npm run example:signalr" to start SignalR example');
console.log('   • Check out the README.md for usage instructions');
console.log('   • Import { WebSocketSignalRDevToolsPanel } from "@tanstack/websocket-signalr-devtools" in your app\n');
console.log('Happy debugging! 🐛🔧');