# discord-bot

Got bored and decided to make a discord bot 

## Supported Commands


Discord Bot (modern scaffold)

Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill `TOKEN` and `CLIENT_ID` (and optional `GUILD_ID` for fast testing)

3. Register commands (recommended during development):

```bash
npm run register-commands
```

4. Run the bot:

```bash
npm run dev
# or
npm start
```

Files

- `bot.js`: main entrypoint using `discord.js` v14 and loads commands from `./commands`
- `commands.js`: registers slash commands with Discord
- `commands/*.js`: example slash commands (`ping`, `coin`)

Notes

- Keep your bot token private. Do not commit `.env`.
- If you need legacy message-based commands, we can add a message handler as well.