/*
 Register local slash commands with Discord using environment variables.
 Usage: `npm run register-commands` (reads TOKEN, CLIENT_ID, optional GUILD_ID from .env)
*/
require('dotenv').config();
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	if (command.data) commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
	try {
		console.log('Registering commands...');
		if (process.env.GUILD_ID) {
			await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
			console.log('Registered guild commands.');
		} else {
			await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
			console.log('Registered global commands (may take up to 1 hour to propagate).');
		}
	} catch (error) {
		console.error(error);
	}
})();