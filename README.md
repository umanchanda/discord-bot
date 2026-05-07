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

- `/wti`
  - What it does: Fetches the latest WTI crude oil futures price (CL=F) via Yahoo Finance.
  - Example output: `WTI Crude Oil (CL=F): **$78.45/barrel** (+1.23, +1.59%)`

- `/brent`
  - What it does: Fetches the latest Brent crude oil futures price (BZ=F) via Yahoo Finance.
  - Example output: `Brent Crude Oil (BZ=F): **$81.20/barrel** (+0.90, +1.12%)`

- `/btc`
  - What it does: Fetches the latest Bitcoin price (BTC-USD) via Yahoo Finance.
  - Example output: `Bitcoin Price: **$62,450.00** (+1234.56, +2.01%)`

- `/sp500`
  - What it does: Fetches the latest S&P 500 index price (^GSPC) via Yahoo Finance.
  - Example output: `S&P 500: **5,200.00** (+45.00, +0.87%)`

- `/nasdaq`
  - What it does: Fetches the latest NASDAQ Composite index price (^IXIC) via Yahoo Finance.
  - Example output: `NASDAQ: **16,300.00** (+120.00, +0.74%)`

- `/tqqq`
  - What it does: Fetches the latest ProShares UltraPro QQQ (TQQQ) ETF price via Yahoo Finance.
  - Example output: `TQQQ: **$52.30** (+2.10, +4.18%)`

- `/sso`
  - What it does: Fetches the latest ProShares Ultra S&P500 (SSO) ETF price via Yahoo Finance.
  - Example output: `SSO: **$85.40** (+1.20, +1.43%)`

- `/goog`
  - What it does: Fetches the latest Alphabet/Google (GOOGL) stock price via Yahoo Finance.
  - Example output: `GOOGL: **$175.40** (-1.20, -0.68%)`

- `/luv`
  - What it does: Fetches the latest Southwest Airlines (LUV) stock price via Yahoo Finance.
  - Example output: `Southwest Airlines (LUV): **$29.10** (-0.45, -1.52%)`

- `/gas`
  - What it does: Scrapes the AAA website for the current national average gas price.
  - Example output: `AAA National Average Gas Price: **$3.45/gallon**`

- `/feargreed`
  - What it does: Fetches the current CNN Fear & Greed Index via RapidAPI. Requires `RAPIDAPI_KEY`.
  - Example output: `CNN Fear & Greed Index: **72/100** — **Greed**`

- `/balance`
  - What it does: Fetches your Fidelity account balances via Plaid (ephemeral reply). Requires `PLAID_CLIENT_ID`, `PLAID_SECRET`, and `PLAID_ACCESS_TOKEN`.
  - Example output: `Fidelity Balances — Brokerage (••••1234): $12,345.67 | Total: $12,345.67`

### Sports

- `/bball year:YYYY month:MM day:DD`
  - What it does: Returns a link to NBA scores for a specific date from the NBA API.
  - Example output: `https://uman230-nba-api-2a9531748263.herokuapp.com/scores/2024/04/01`

- `/f1 year:YYYY`
  - What it does: Fetches the F1 race schedule for a given season via the Jolpi/Ergast API. Presents a dropdown to select a race and then shows a top-10 results embed with podium, fastest lap, and pole position.
  - Example output: Embed with podium, top 10, fastest lap, and pole for the selected race.

- `/flight callsign:"CALLSIGN"`
  - What it does: Tracks a live flight by callsign via the ADS-B Exchange RapidAPI. Returns an embed with position, altitude, ground speed, heading, squawk, and ICAO hex. Requires `RAPIDAPI_KEY`.
  - Example output: Embed showing `UAL123` at 35,000 ft, 480 kts, heading 270° W.

### Entertainment

- `/tomato movie:"TITLE"`
  - What it does: Looks up the Rotten Tomatoes Tomatometer and Audience score for a movie.
  - Example output: `🍅 **Inception** (2010): **87%** Tomatometer | **91%** Audience`

### Other

- `/weather zip:XXXXX`
  - What it does: Looks up current weather for a US ZIP code using `WEATHER_API_KEY`.
  - Example output: `The temperature is 72.3°F — location: Beverly Hills`

## Automated Crons

| Schedule | What it does |
|---|---|
| Top of every hour, 8am–5pm M–F | Posts WTI crude oil price to `WTI_CHANNEL_ID` |
| 1:20pm M–F | Pings user with WTI price + Kalshi link to `WTI_CHANNEL_ID` |
| Every 5 min 8:30–8:55am M–F | Posts TQQQ price to `TQQQ_CHANNEL_ID` |
| Every 15 min 9am–2pm M–F | Posts TQQQ price to `TQQQ_CHANNEL_ID` |
| Every 5 min 8:30–8:55am M–F | Posts SSO price to `TQQQ_CHANNEL_ID` |
| Every 15 min 9am–2pm M–F | Posts SSO price to `TQQQ_CHANNEL_ID` |
| :10, :25, :40 every hour | Posts BTC price + Kalshi link to `BTC_CHANNEL_ID` |
| :55 every hour | Pings user with BTC price + Kalshi daily link to `BTC_CHANNEL_ID` |
| 2:45pm M–F | Pings user with S&P 500 price to `SP500_CHANNEL_ID` |
| 2:45pm M–F | Pings user with NASDAQ price to `NASDAQ_CHANNEL_ID` |
| 4:55pm M–F | Pings user with Brent crude price to `BRENT_CHANNEL_ID` |

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
| `WEATHER_API_KEY` | API key for OpenWeatherMap |
| `USER_ID` | Discord user ID to ping in scheduled cron messages |
| `WTI_CHANNEL_ID` | Channel ID for WTI crude oil cron messages |
| `TQQQ_CHANNEL_ID` | Channel ID for TQQQ cron messages |
| `BTC_CHANNEL_ID` | Channel ID for Bitcoin cron messages |
| `SP500_CHANNEL_ID` | Channel ID for S&P 500 cron messages |
| `NASDAQ_CHANNEL_ID` | Channel ID for NASDAQ cron messages |
| `BRENT_CHANNEL_ID` | Channel ID for Brent crude oil cron messages |
| `RAPIDAPI_KEY` | RapidAPI key for the Fear & Greed Index API |
| `PLAID_CLIENT_ID` | Plaid client ID for the `/balance` command |
| `PLAID_SECRET` | Plaid secret for the `/balance` command |
| `PLAID_ACCESS_TOKEN` | Plaid access token for the linked Fidelity account |
| `PLAID_ENV` | Plaid environment (`sandbox` or `production`, defaults to `sandbox`) |

## Files

- `bot.js` — main entrypoint, loads commands from `./commands`
- `commands.js` — registers slash commands with Discord
- `crons.js` — all scheduled cron jobs
- `commands/*.js` — individual slash command handlers

## Heroku Commands

```bash
heroku restart --app umanchanda-discord-bot
heroku config:set ENV_VAR=value --app umanchanda-discord-bot
heroku logs --tail --app umanchanda-discord-bot
```
