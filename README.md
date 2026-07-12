# discord-bot

Got bored and decided to make a discord bot

## Supported Commands

### Fun / Utility

- `/ping`
  - What it does: Replies immediately with `Pong!`.
  - Example output: `Pong!`

- `/coin`
  - What it does: Flips a coin and returns either `heads` or `tails`.
  - Example output: `heads`

- `/dice [sides]`
  - Usage: `/dice` or `/dice sides:10`
  - What it does: Rolls a die (default 6 sides). Optional `sides` integer between 1 and 50.
  - Example output: `4`

- `/epoch`
  - What it does: Returns the current epoch timestamp in seconds.
  - Example output: `1700000000`

- `/emojify text:"TEXT"`
  - What it does: Converts letters and digits into regional indicator and number emojis.
  - Example output: `:regional_indicator_h: :regional_indicator_e: ...`

- `/insult`
  - What it does: Fetches a random insult from an external API and returns the text.
  - Example output: `You're a [insult text]`

- `/putin`
  - What it does: Replies with a fixed YouTube link.
  - Example output: `https://youtu.be/noQXojwExRA`

- `/dudewtf`
  - What it does: Replies with a YouTube link.

- `/trivia [questions]`
  - Usage: `/trivia` or `/trivia questions:5`
  - What it does: Runs an interactive sports trivia quiz (multiple choice, button answers) from the Open Trivia DB. Optional `questions` integer between 1 and 20 (default 1). Reports a running and final score.
  - Example output: Buttoned question rounds ending in `🏆 Final Score: **3/5**`.

### Memes

- `/boi top:"TOP" bottom:"BOTTOM"`
  - What it does: Generates a custom memegen image and replies with a direct image URL.

- `/facepalm top:"TOP" bottom:"BOTTOM"`
  - What it does: Generates a Facepalm meme image URL and replies with it.

- `/headout [top] [bottom]`
  - What it does: Generates a custom meme URL using a preset background image.

- `/mock top:"TOP" bottom:"BOTTOM"`
  - What it does: Generates a SpongeBob mock meme image URL and replies with it.

### Market Data

- `/price asset:ASSET`
  - What it does: Fetches the latest price for a selected asset via Yahoo Finance. Pick from a dropdown of supported assets: WTI Crude Oil (CL=F), Brent Crude Oil (BZ=F), Bitcoin (BTC-USD), S&P 500 (^GSPC), NASDAQ (^IXIC), TQQQ, SSO, Google (GOOGL), and NVIDIA (NVDA). Price, change, and percent change are formatted per asset type.
  - Example output: `WTI Crude Oil (CL=F): **$78.45/barrel** (+1.23, +1.59%)` or `Bitcoin Price: **$62,450.00** (+1234.56, +2.01%)`

- `/gas`
  - What it does: Scrapes the AAA website for the current national average gas price.
  - Example output: `AAA National Average Gas Price: **$3.45/gallon**`

- `/feargreed`
  - What it does: Fetches the current CNN Fear & Greed Index via RapidAPI. Requires `RAPIDAPI_KEY`.
  - Example output: `CNN Fear & Greed Index: **72/100** — **Greed**`

### Sports

- `/bball year:YYYY month:MM day:DD`
  - What it does: Returns a link to NBA scores for a specific date from the NBA API.
  - Example output: `https://uman230-nba-api-2a9531748263.herokuapp.com/scores/2024/04/01`

- `/f1 year:YYYY`
  - What it does: Fetches the F1 race schedule for a given season via the Jolpi/Ergast API. Presents a dropdown to select a race and then shows a top-10 results embed with podium, fastest lap, and pole position.
  - Example output: Embed with podium, top 10, fastest lap, and pole for the selected race.

- `/soccerstats league:LEAGUE year:YYYY month:MM day:DD`
  - What it does: Looks up soccer matches for a date in a chosen league (Premier League, La Liga, Bundesliga, Ligue 1, or MLS) via the ESPN API. Presents a dropdown to select a match and shows an embed with score, match stats (possession, shots, corners, fouls, cards), goals, and venue.
  - Example output: Embed with the final score, stats breakdown, and goal timeline for the selected match.

- `/flight callsign:"CALLSIGN"`
  - What it does: Tracks a live flight by callsign via the ADS-B Exchange RapidAPI. Returns an embed with position, altitude, ground speed, heading, squawk, and ICAO hex. Requires `RAPIDAPI_KEY`.
  - Example output: Embed showing `UAL123` at 35,000 ft, 480 kts, heading 270° W.

- `/diary stats`
  - What it does: Shows overall personal flight-diary stats (total flights, hours flown, unique airlines/airports, top aircraft and airports) via the flight-data API.
  - Example output: Embed with totals and top-3 aircraft/airports.

- `/diary flights [airline] [aircraft]`
  - What it does: Lists the most recent flights, optionally filtered by airline name and/or aircraft type.
  - Example output: Embed listing up to 5 recent flights with date, flight number, route, duration, and airline.

- `/diary registration reg:"REG"`
  - What it does: Looks up an aircraft registration (e.g. `N8670A`), showing manufacturer, model, operator, country, Mode-S, and how many times you've flown on it.
  - Example output: Embed with aircraft details and your last flight on it.

### Entertainment

- `/movies`
  - What it does: Fetches the watched-movies list from the movie database API and displays every movie in chunked embeds.
  - Example output: One or more embeds listing all watched movies with their release years.

- `/tomato movie:"TITLE"`
  - What it does: Looks up the Rotten Tomatoes Tomatometer and Audience score for a movie.
  - Example output: `🍅 **Inception** (2010): **87%** Tomatometer | **91%** Audience`

### Other

- `/weather zip:XXXXX`
  - What it does: Looks up current weather for a US ZIP code using `WEATHER_API_KEY`.
  - Example output: `The temperature is 72.3°F — location: Beverly Hills`

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in the values (see below).

3. Register slash commands:

```bash
npm run register-commands
```

4. Run the bot:

```bash
npm run dev   # development (nodemon)
npm start     # production
```

## Environment Variables

| Variable | Description |
|---|---|
| `TOKEN` | Discord bot token |
| `CLIENT_ID` | Discord application client ID |
| `GUILD_ID` | (Optional) Guild ID for fast command registration during development |
| `WEATHER_API_KEY` | API key for OpenWeatherMap (used by `/weather`) |
| `RAPIDAPI_KEY` | RapidAPI key for the Fear & Greed Index (`/feargreed`) and flight tracking (`/flight`) |
| `FLIGHT_DIARY_API_URL` | (Optional) Base URL for the flight-diary API used by `/diary` (defaults to the hosted instance) |

## Files

- `bot.js` — main entrypoint, loads commands from `./commands`
- `commands.js` — registers slash commands with Discord
- `commands/*.js` — individual slash command handlers

## Heroku Commands

```bash
heroku restart --app umanchanda-discord-bot
heroku config:set ENV_VAR=value --app umanchanda-discord-bot
heroku logs --tail --app umanchanda-discord-bot
```
