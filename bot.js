/*
 Modern bot entrypoint using discord.js v14 and slash commands.
 - Uses `.env` for secrets (see .env.example)
 - Loads commands from ./commands
*/
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { registerCrons } = require('./crons');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${file}`);
		let name = undefined;
		try {
			name = command.data && (command.data.name || command.data.toJSON && command.data.toJSON().name);
		} catch (e) {
			name = undefined;
		}
		if (name && command.execute) {
			client.commands.set(name, command);
		} else {
			console.warn(`Skipping loading command from ${file} — missing name or execute`);
		}
	}
}
console.log(`Loaded commands: ${[...client.commands.keys()].join(', ')}`);

const uman230 = process.env.USER_ID;

let _readyHandled = false;
const _handleReady = () => {
	if (_readyHandled) return;
	_readyHandled = true;
	console.log(`Logged in as ${client.user.tag}`);
};
client.once('clientReady', _handleReady);

registerCrons(client, uman230);

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;
	console.log(`Interaction received: ${interaction.commandName} from ${interaction.user.tag}`);
	const command = client.commands.get(interaction.commandName);
	if (!command) {
		try {
			await interaction.reply({ content: 'Command not available on this bot instance.', ephemeral: true });
		} catch (err) {
			console.error('Failed to reply to unknown command interaction:', err);
		}
		return;
	}
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error executing that command.', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
		}
	}
});

// Listen for regular messages and respond when someone mentions "Tito"
// client.on('messageCreate', message => {
// 	if (message.author?.bot) return;
// 	const content = message.content;
// 	if (!content) return;
// 	if (content.toLowerCase().includes('tito')) {
// 		message.channel.send('SHUT UP <@139835342718107648>.').catch(console.error);
// 	}
// });

client.on('messageCreate', message => {
	if (message.author?.bot) return;
	if (message.content?.toLowerCase().startsWith('sudo')) {
		message.channel.send(`${message.author.username} is not in the sudoers file. This incident will be reported.`).catch(console.error);
	}
});

const token = process.env.TOKEN;
if (!token) {
	console.error('Missing TOKEN in environment. Create a .env file from .env.example');
	process.exit(1);
}

client.login(token);
