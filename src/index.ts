import dotenv from 'dotenv';
import { Client, GatewayIntentBits, Interaction } from 'discord.js';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const targetUserEnv = process.env.TARGET_USER || 'b20sharkey14_78548';
if (!token) {
  console.error('Missing DISCORD_TOKEN in environment. See .env.example');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Bluubot logged in as ${client.user?.tag}`);
  // Notify target user on startup
  if (token === 'MOCK_TOKEN') {
    console.log(`MOCK: would DM ${targetUserEnv} about startup`);
  } else {
    sendDM(targetUserEnv, 'Bluubot is now online.').catch((err) => console.error('Startup DM failed:', err));
  }
});

client.on('interactionCreate', async (interaction: Interaction) => {
  if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
    console.log(`Received command: ${interaction.commandName}`);
    // Placeholder: command responses will be implemented later
  }
});

if (token === 'MOCK_TOKEN') {
  console.log('Running in MOCK mode: skipping Discord login.');
  console.log('Bluubot mock ready');
  // Keep process alive for local testing without connecting
  setInterval(() => {}, 1000);
} else {
  client.login(token).catch((err) => {
    console.error('Failed to login:', err);
    process.exit(1);
  });
}

async function sendDM(target: string, content: string) {
  if (token === 'MOCK_TOKEN') {
    console.log(`MOCK: sendDM to ${target}: ${content}`);
    return;
  }

  try {
    // If target is numeric, treat as user ID
    if (/^\d+$/.test(target)) {
      const user = await client.users.fetch(target);
      await user.send(content);
      return;
    }

    // Try to find in cache by tag or username
    const found = client.users.cache.find(
      (u) => u.tag === target || u.username === target || `${u.username}_${u.discriminator}` === target
    );
    if (found) {
      await found.send(content);
      return;
    }

    // Fallback: search guilds for the member (requires GuildMembers intent)
    for (const [, guild] of client.guilds.cache) {
      try {
        // If the target is like username#discrim, try to match tag after fetching a small set
        if (/^.+#\d{4}$/.test(target)) {
          // fetch by query won't match discriminator; try to fetch members around username via query
          const usernameOnly = target.split('#')[0];
          const res = await guild.members.fetch({ query: usernameOnly, limit: 10 });
          const member = res.find((m) => m.user.tag === target);
          if (member) {
            await member.send(content);
            return;
          }
        } else {
          // query by username or nickname
          const res = await guild.members.fetch({ query: target, limit: 1 });
          const member = res.first();
          if (member) {
            await member.send(content);
            return;
          }
        }
      } catch (err) {
        // ignore guilds we can't fetch members for
      }
    }

    console.warn(`Could not resolve target user '${target}' from cache or guilds. Provide numeric user ID in TARGET_USER for reliable DMs.`);
  } catch (err) {
    console.error('Error sending DM to', target, err);
    throw err;
  }
}

let shuttingDown = false;
async function gracefulShutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('Graceful shutdown initiated');
  try {
    if (token === 'MOCK_TOKEN') {
      console.log(`MOCK: would DM ${targetUserEnv} about shutdown`);
    } else {
      await sendDM(targetUserEnv, 'Bluubot is shutting down.');
    }
  } catch (err) {
    console.error('Shutdown DM failed:', err);
  }
  try {
    await client.destroy();
  } catch {}
  process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('beforeExit', gracefulShutdown);
