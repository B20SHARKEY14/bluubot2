import dotenv from 'dotenv';
import { Client, GatewayIntentBits, Interaction } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Load greeting variations
const variationsPath = path.join(__dirname, '../variations.json');
const variations = JSON.parse(fs.readFileSync(variationsPath, 'utf-8'));

// Load user variations
const userVariationsPath = path.join(__dirname, '../user-variations.json');
const userVariations = JSON.parse(fs.readFileSync(userVariationsPath, 'utf-8'));

// Spam tracking
interface SpamSession {
  channelId: string;
  message: string;
  interval: NodeJS.Timeout;
}

const spamSessions = new Map<string, SpamSession>();

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
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

client.once('clientReady', () => {
  console.log(`Bluubot logged in as ${client.user?.tag}`);
  // Notify target user on startup
  if (token === 'MOCK_TOKEN') {
    console.log(`MOCK: would DM ${targetUserEnv} about startup`);
  } else {
    sendDM(targetUserEnv, 'Bluubot is now online.').catch((err) => console.error('Startup DM failed:', err));
  }
});

client.on('interactionCreate', async (interaction: Interaction) => {
  console.log(`[DEBUG] Interaction received! Type: ${interaction.type}`);
  
  if (interaction.isChatInputCommand()) {
    const commandName = interaction.commandName;
    console.log(`[DEBUG] Slash command received: ${commandName}`);

    if (commandName === 'spam') {
      const message = interaction.options.getString('message');
      const userId = interaction.user.id;
      const channelId = interaction.channelId;

      if (!message || !channelId) {
        await interaction.reply('Invalid spam command!');
        return;
      }

      // Stop any existing spam for this user
      if (spamSessions.has(userId)) {
        clearInterval(spamSessions.get(userId)?.interval);
        spamSessions.delete(userId);
      }

      // Start new spam session
      const channel = await interaction.client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        await interaction.reply('Channel not found or is not a text channel!');
        return;
      }

      const interval = setInterval(async () => {
        try {
          await (channel as any).send(message);
        } catch (err) {
          console.error('Failed to send spam message:', err);
          clearInterval(interval);
          spamSessions.delete(userId);
        }
      }, 1000); // Send every 1 second

      spamSessions.set(userId, { channelId, message, interval });
      await interaction.reply(`🚀 Spamming "${message}" in this channel! Use /stopspam to stop.`);
    } else if (commandName === 'stopspam') {
      const userId = interaction.user.id;

      if (spamSessions.has(userId)) {
        const session = spamSessions.get(userId);
        clearInterval(session?.interval);
        spamSessions.delete(userId);
        await interaction.reply('✅ Spam stopped!');
      } else {
        await interaction.reply('No active spam session found!');
      }
    } else if (commandName === 'stop') {
      await interaction.reply('🛑 Shutting down the bot...');
      console.log('Bot shutdown command received. Exiting...');
      process.exit(0);
    } else if (commandName === 'spamstatus') {
      if (spamSessions.size === 0) {
        await interaction.reply("${Message}")
      } else {
        let Message = `There are currently ${spamSessions.size} active spam session(s):\n`;
        await interaction.reply("${Message}");
      }
    }
  } else {
    console.log(`[DEBUG] Non-slash-command interaction received. Type: ${interaction.type}`);
  }
});

client.on('messageCreate', async (message) => {
  // Ignore bot messages and messages from bots
  if (message.author.bot || message.author.id === client.user?.id) return;

  // Check if the message mentions the bot
  if (message.mentions.has(client.user?.id || '')) {
    try {
      // Remove the mention from the message for cleaner text analysis
      const messageContent = message.content
        .replace(/<@!?\d+>/g, '') // Remove mention tags
        .toLowerCase()
        .trim();

      console.log(`[DEBUG] Cleaned message: "${messageContent}"`);

      // Check for user greetings (just check for greeting words, not @bluubot)
      const greetingWords = ['hello', 'hi', 'hey', 'wassup', 'yo', 'heya', 'heyo', "what's up"];
      const isGreeting = greetingWords.some((word) => messageContent.includes(word));

      // Check for user questions
      const questionMatch = userVariations.userQuestions.find((q: any) => {
        const questionLower = (typeof q === 'string' ? q : q.question).toLowerCase();
        return messageContent.includes(questionLower) || messageContent.startsWith(questionLower.substring(0, 5));
      });

      // Check for user commands
      const commandMatch = userVariations.userCommands.find((c: any) => {
        const commandLower = (typeof c === 'string' ? c : c.command).toLowerCase();
        return messageContent.includes(commandLower);
      });

      console.log(`[DEBUG] isGreeting: ${isGreeting}, question: ${questionMatch}, command: ${commandMatch}`);

      let response = '';

      if (isGreeting) {
        response = variations.greetings[Math.floor(Math.random() * variations.greetings.length)];
      } else if (questionMatch) {
        response = typeof questionMatch === 'string' 
          ? "Great question! I'm here to help. What would you like to know?" 
          : questionMatch.answer;
      } else if (commandMatch) {
        response = typeof commandMatch === 'string' 
          ? "I like your style! What would you like me to do?" 
          : commandMatch.answer;
      } else {
        response = variations.greetings[Math.floor(Math.random() * variations.greetings.length)];
      }

      await message.reply(response);
      console.log(`[DEBUG] Reply sent: "${response}"`);
    } catch (err) {
      console.error('Failed to reply to mention:', err);
    }
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
