const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../frontend/.env.mode');

if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env.mode file found');
  console.log('   Defaulting to: MAINNET MODE');
  console.log('');
  console.log('💡 Run "npm run use:demo" or "npm run use:mainnet" to set a mode');
  process.exit(0);
}

const content = fs.readFileSync(envPath, 'utf-8');
const match = content.match(/NEXT_PUBLIC_DATA_MODE=(\w+)/);

if (!match) {
  console.log('⚠️  Could not parse .env.mode file');
  process.exit(1);
}

const mode = match[1];

if (mode === 'demo') {
  console.log('📊 Current Mode: DEMO');
  console.log('');
  console.log('   Using sample data from:');
  console.log('   frontend/public/data/sample-users.json');
  console.log('');
  console.log('   No backend services needed');
  console.log('');
  console.log('💡 Switch to mainnet: npm run use:mainnet');
} else if (mode === 'mainnet') {
  console.log('🌐 Current Mode: MAINNET');
  console.log('');
  console.log('   Using real blockchain data from:');
  console.log('   BSC Mainnet → Supabase Database');
  console.log('');
  console.log('   Requires backend services:');
  console.log('   cd services && npm run start:all');
  console.log('');
  console.log('💡 Switch to demo: npm run use:demo');
} else {
  console.log('⚠️  Unknown mode:', mode);
}
