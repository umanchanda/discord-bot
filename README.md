# discord-bot

Got bored and decided to make a discord bot

## Supported Commands

### Fun / Utility

- `/ping`
  - Output: Plain text `Pong!`.

- `/coin`
  - Output: Plain text `heads` or `tails`.

- `/dice [sides]`
  - Output: Plain text roll result. `sides` is optional and defaults to 6.

- `/epoch`
  - Output: Plain text Unix epoch time in seconds.

- `/emojify text:"TEXT"`
  - Output: Plain text version of the input converted into emoji characters.

- `/insult`
  - Output: Plain text random insult from the external API.

- `/putin`
  - Output: Plain text YouTube link.

- `/dudewtf`
  - Output: Plain text YouTube link.

- `/trivia [questions]`
  - Output: Interactive trivia quiz with button answers, running score updates, and a final score message.

### Memes

- `/boi top:"TOP" bottom:"BOTTOM"`
  - Output: Plain text image URL for a custom memegen image.

- `/facepalm top:"TOP" bottom:"BOTTOM"`
  - Output: Plain text image URL for a Facepalm meme.

- `/headout [top] [bottom]`
  - Output: Plain text image URL for a preset meme template.

- `/mock top:"TOP" bottom:"BOTTOM"`
  - Output: Plain text image URL for a SpongeBob mock meme.

### Market Data

- `/price asset:ASSET`
  - Output: Plain text latest quote for the selected asset, with price, change, and percent change formatted per asset type.

- `/gas`
  - Output: Plain text current AAA national average gas price.

- `/feargreed`
  - Output: Plain text CNN Fear & Greed Index value and label.

### Sports And Travel

- `/bball year:YYYY month:MM day:DD`
  - Output: Plain text NBA scores URL for the selected date.

- `/f1 year:YYYY`
  - Output: Interactive race picker followed by an embed with podium, top 10, fastest lap, and pole position.

- `/soccerstats league:LEAGUE year:YYYY month:MM day:DD`
  - Output: Interactive match picker followed by an embed with score, match stats, goals, and venue.

- `/flight callsign:"CALLSIGN"`
  - Output: Rich embed with live tracking details such as position, altitude, ground speed, heading, squawk, and ICAO hex.

- `/diary stats`
  - Output: Rich embed with overall flight-diary stats, including totals, hours, unique airlines and airports, and top aircraft and airports.

- `/diary flights [airline] [aircraft]`
  - Output: Paginated embed listing recent flights, optionally filtered by airline or aircraft.

- `/diary years year:YYYY`
  - Output: Paginated embed filtered to a selected year.

- `/diary airlines`
  - Output: Airline dropdown followed by a paginated embed filtered to the selected airline.

- `/diary registration`
  - Output: Registration dropdown followed by an embed with aircraft metadata, your flight count on that aircraft, and last-flown route details when available.

- `/routeanalyzer origin:ORIGIN destination:DESTINATION`
  - Output: Rich embed showing route distance, jet fuel price, aircraft list, estimated fuel use and cost per aircraft, route notes, and pricing notes. If no route exists, the bot replies with plain text instead.

### Entertainment

- `/movies`
  - Output: Paginated embeds listing the watched-movies catalog with release years.

- `/tomato movie:"TITLE"`
  - Output: Plain text Rotten Tomatoes Tomatometer and Audience score, with the movie URL when available.

### Other

- `/weather zip:XXXXX`
  - Output: Plain text current weather for a US ZIP code.

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
