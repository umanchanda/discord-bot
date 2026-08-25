const { SlashCommandBuilder } = require('@discordjs/builders');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

const comma2 = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const comma4 = n => n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const SIGN_RE = /^[A-Z0-9.\-^=]{1,15}$/;

const formatNumber = n => (Math.abs(n) < 1 ? comma4(n) : comma2(n));

function formatQuote(symbol, quote) {
    const displayName = quote.shortName || quote.longName || symbol;
    const price = formatNumber(quote.regularMarketPrice);
    const change = formatNumber(quote.regularMarketChange ?? 0);
    const changePct = (quote.regularMarketChangePercent ?? 0).toFixed(2);
    const currency = quote.currency || 'USD';
    const sign = (quote.regularMarketChange ?? 0) >= 0 ? '+' : '';
    return `${displayName} (${symbol}): **${price} ${currency}** (${sign}${change}, ${sign}${changePct}%)`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('price')
        .setDescription('Get the latest price for any stock ticker')
        .addStringOption(opt =>
            opt.setName('ticker')
                .setDescription('Stock ticker symbol (e.g. AAPL, TSLA, NVDA)')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const rawTicker = interaction.options.getString('ticker');
        const ticker = rawTicker.trim().toUpperCase();
        if (!SIGN_RE.test(ticker)) {
            return interaction.editReply('Invalid ticker format. Use letters/numbers and optional `.`, `-`, `^`, `=`.');
        }
        try {
            const quote = await yahooFinance.quote(ticker);
            if (!quote || quote.regularMarketPrice == null) {
                return interaction.editReply(`No price data available right now for ${ticker}.`);
            }
            return interaction.editReply(formatQuote(ticker, quote));
        } catch (err) {
            console.error(`price command error (${ticker}):`, err);
            try { await interaction.editReply(`Failed to fetch price for ${ticker}.`); } catch (e) {}
        }
    },
};
