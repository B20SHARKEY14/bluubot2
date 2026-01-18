import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error('Missing DISCORD_TOKEN in environment');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log(`Bot logged in as ${client.user?.tag}`);
  console.log(`Fetching all guilds...`);

  try {
    // Fetch all guilds the bot is in
    const guilds = await client.guilds.fetch();
    
    console.log(`\nBot is in ${guilds.size} server(s):\n`);
    
    const guildIds: string[] = [];
    
    guilds.forEach((guild, id) => {
      console.log(`- ${guild.name} (ID: ${id})`);
      guildIds.push(id);
    });

    // Update .env with guild IDs
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');

    // Remove old GUILD_ID entries
    envContent = envContent.replace(/^GUILD_ID=.*/gm, '');
    envContent = envContent.trim() + '\n';

    // Add all guild IDs
    guildIds.forEach((guildId, index) => {
      if (index === 0) {
        envContent += `GUILD_ID=${guildId}\n`;
      } else {
        envContent += `GUILD_ID_${index + 1}=${guildId}\n`;
      }
    });

    fs.writeFileSync(envPath, envContent);

    console.log(`\n✅ Saved ${guildIds.length} guild ID(s) to .env`);
    console.log(`First guild ID set as GUILD_ID for command registration`);
    
    process.exit(0);
  } catch (err) {
    console.error('Failed to fetch guilds:', err);
    process.exit(1);
  }
});

client.login(token);
