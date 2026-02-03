# discord-bot

Got bored and decided to make a discord bot 

## Supported Commands

- `/ping`:
	- Usage: `/ping`
	- What it does: Replies immediately with `Pong!`.
	- Example output: `Pong!`

- `/coin`:
	- Usage: `/coin`
	- What it does: Flips a coin and returns either `heads` or `tails`.
	- Example output: `heads`

- `/dice [sides]`:
	- Usage: `/dice` or `/dice sides:10`
	- What it does: Rolls a die (default 6 sides). Optional `sides` integer between 1 and 50.
	- Example output: `4`

- `/epoch`:
	- Usage: `/epoch`
	- What it does: Returns the current epoch timestamp in seconds.
	- Example output: `1700000000`

- `/emojify text`:
	- Usage: `/emojify text:"hello world"`
	- What it does: Converts letters and digits into regional indicator and number emojis.
	- Example output: `:regional_indicator_h: :regional_indicator_e: :regional_indicator_l: :regional_indicator_l: :regional_indicator_o:`

- `/boi top:"TOP" bottom:"BOTTOM"`:
	- Usage: `/boi top:"Top text" bottom:"Bottom text"`
	- What it does: Generates a custom memegen image and replies with a direct image URL.
	- Example output: `https://api.memegen.link/images/custom/Top_Text/Bottom_Text.png?...`

- `/facepalm top:"TOP" bottom:"BOTTOM"`:
	- Usage: `/facepalm top:"Top text" bottom:"Bottom text"`
	- What it does: Generates a Facepalm meme image URL and replies with it.
	- Example output: `https://api.memegen.link/images/facepalm/Top_Text/Bottom_Text.jpg?...`

- `/headout [top] [bottom]`:
	- Usage: `/headout top:"..." bottom:"..."` (both options optional)
	- What it does: Generates a custom meme URL using a preset background image.
	- Example output: `https://api.memegen.link/images/custom/Top/Bottom.jpg?background=...`

- `/mock top:"TOP" bottom:"BOTTOM"`:
	- Usage: `/mock top:"Top" bottom:"Bottom"`
	- What it does: Generates a SpongeBob mock meme image URL and replies with it.
	- Example output: `https://api.memegen.link/images/spongebob/Top/Bottom.jpg?...`

- `/insult`:
	- Usage: `/insult`
	- What it does: Fetches a random insult from an external API and returns the text. If the API fails, returns an error message.
	- Example output: `You're a [insult text]`

- `/putin`:
	- Usage: `/putin`
	- What it does: Replies with a fixed YouTube link.
	- Example output: `https://youtu.be/noQXojwExRA`

- `/weather zip:xxxxx`:
	- Usage: `/weather zip:"90210"`
	- What it does: Looks up current weather for a US ZIP using `WEATHER_API_KEY` (must be set). Replies with temperature in °F and location or an error if the API key / ZIP is invalid.
	- Example output: `The temperature is 72.3°F — location: Beverly Hills`

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