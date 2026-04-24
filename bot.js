/*
 Modern bot entrypoint using discord.js v14 and slash commands.
 - Uses `.env` for secrets (see .env.example)
 - Loads commands from ./commands
*/
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const { fetchBtcMessage } = require('./commands/btc');
const { fetchWtiMessage } = require('./commands/wti');
const { fetchTqqqMessage } = require('./commands/tqqq');

// Include message-related intents so the bot can read message content.
// Note: `MessageContent` is a privileged intent and must be enabled in the
// Discord Developer Portal for your application if required.
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${file}`);
		// Some command modules expose a SlashCommandBuilder; ensure we get the command name reliably
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

const uman230 = process.env.USER_ID

// Support both current `ready` and future `clientReady` event names.
let _readyHandled = false;
const _handleReady = () => {
	if (_readyHandled) return;
	_readyHandled = true;
	console.log(`Logged in as ${client.user.tag}`);
};
client.once('ready', _handleReady);
client.once('clientReady', _handleReady);

const sendWtiUpdate = async () => {
    const channelId = process.env.WTI_CHANNEL_ID;
    if (!channelId) return;
    try {
        const msg = await fetchWtiMessage();
        if (!msg) return;
        const channel = await client.channels.fetch(channelId);
        await channel.send(`<@${uman230}> ${msg}`);
    } catch (err) {
        console.error('WTI cron error:', err);
    }
};

// WTI (CME Globex) trading hours: Sun 5 PM – Fri 4 PM CST, with a 4–5 PM CST daily break
// Mon–Fri midnight to 3:59 PM CST
cron.schedule('0 0-15/2 * * 1-5', sendWtiUpdate);
// Sun–Thu 5 PM to 11:59 PM CST (Sunday open + daily reopen after maintenance)
cron.schedule('0 17-23/2 * * 0-4', sendWtiUpdate);

cron.schedule('30-55/5 8 * * 1-5', async () => {
    const channelId = process.env.TQQQ_CHANNEL_ID;
    if (!channelId) return;
    try {
        const msg = await fetchTqqqMessage();
        if (!msg) return;
        const channel = await client.channels.fetch(channelId);
        await channel.send(`<@${uman230}> ${msg}`);
    } catch (err) {
        console.error('TQQQ cron error:', err);
    }
});

cron.schedule('*/15 9-15 * * 1-5', async () => {
    const channelId = process.env.TQQQ_CHANNEL_ID;
    if (!channelId) return;
    try {
        const msg = await fetchTqqqMessage();
        if (!msg) return;
        const channel = await client.channels.fetch(channelId);
        await channel.send(`<@${uman230}> ${msg}`);
    } catch (err) {
        console.error('TQQQ cron error:', err);
    }
});

cron.schedule('55,10,25,40 * * * *', async () => {
    const channelId = process.env.BTC_CHANNEL_ID;
    if (!channelId) return;
    try {
        const msg = await fetchBtcMessage();
        if (!msg) return;
        const channel = await client.channels.fetch(channelId);
        await channel.send(`<@${uman230}> ${msg} https://kalshi.com/markets/kxbtc15m/bitcoin-price-up-down?utm_source=kalshiweb_eventpage`);
    } catch (err) {
        console.error('BTC cron error:', err);
    }
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;
	console.log(`Interaction received: ${interaction.commandName} from ${interaction.user.tag}`);
	const command = client.commands.get(interaction.commandName);
	if (!command) {
		// Reply immediately so Discord doesn't show "The application did not respond"
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
// Case-insensitive check; ignores bot messages.
client.on('messageCreate', message => {
	if (message.author?.bot) return;
	const content = message.content;
	if (!content) return;
	if (content.toLowerCase().includes('tito')) {
		message.channel.send('SHUT UP <@139835342718107648>.').catch(console.error);
	}
});

const token = process.env.TOKEN;
if (!token) {
	console.error('Missing TOKEN in environment. Create a .env file from .env.example');
	process.exit(1);
}

client.login(token);