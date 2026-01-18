import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const target = process.argv[2] || 'b20sharkey14_78548';

if (!token) {
  console.error('Missing DISCORD_TOKEN in environment.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}. Searching for '${target}' ...`);

  let foundAny = false;
  for (const [, guild] of client.guilds.cache) {
    try {
      const res = await guild.members.fetch({ query: target, limit: 25 });
      for (const [, member] of res) {
        const u = member.user;
        if (u.tag === target || u.username === target || `${u.username}_${u.discriminator}` === target) {
          console.log(`Found in guild ${guild.name} (${guild.id}): ${u.tag} — ID: ${u.id}`);
          foundAny = true;
        }
      }
    } catch (err) {
      // ignore guilds that disallow member fetches
    }
  }

  // also try users cache
  const cached = client.users.cache.find(
    (u) => u.tag === target || u.username === target || `${u.username}_${u.discriminator}` === target
  );
  if (cached) {
    console.log(`Found in user cache: ${cached.tag} — ID: ${cached.id}`);
    foundAny = true;
  }

  if (!foundAny) console.log('No matches found.');
  await client.destroy();
  process.exit(0);
});

client.login(token).catch((err) => {
  console.error('Login failed:', err);
  process.exit(1);
});
