import dotenv from 'dotenv';
import { REST, Routes } from 'discord.js';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in environment');
  process.exit(1);
}

const commands = [
  {
    name: 'spam',
    description: 'Spam a message repeatedly in the current channel',
    options: [
      {
        name: 'message',
        description: 'The message to spam',
        type: 3, // STRING type
        required: true
      }
    ]
  },
  {
    name: 'stopspam',
    description: 'Stop the current spam session'
  }
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Registering slash commands...');

    if (guildId) {
      // Register for specific guild (faster for testing)
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(`Commands registered for guild ${guildId}`);
    } else {
      // Register globally (takes up to 1 hour to propagate)
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('Commands registered globally');
    }
  } catch (error) {
    console.error('Failed to register commands:', error);
    process.exit(1);
  }
})();
