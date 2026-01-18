import dotenv from 'dotenv';
import { exec } from 'child_process';
import { platform } from 'os';

dotenv.config();

const clientId = process.env.CLIENT_ID;

if (!clientId) {
  console.error('Missing CLIENT_ID in .env');
  process.exit(1);
}

// Permission codes:
// 2048 = Send Messages
// 1024 = View Channels (Read Messages)
// 65536 = Read Message History
const permissions = 2048 + 1024 + 65536;

const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;

console.log('🤖 Bluubot Invite URL:');
console.log(inviteUrl);
console.log('\n✅ Permissions included:');
console.log('  • Send Messages');
console.log('  • View Channels / Read Messages');
console.log('  • Read Message History');
console.log('  • Slash Commands');

console.log('\n📋 Opening invite URL in browser...\n');

// Open URL based on OS
const startCommand = platform() === 'darwin' ? 'open' : platform() === 'win32' ? 'start' : 'xdg-open';
exec(`${startCommand} "${inviteUrl}"`, (err) => {
  if (err) {
    console.log('Could not open browser automatically.');
    console.log('Copy and paste this URL in your browser:');
    console.log(inviteUrl);
  }
});
