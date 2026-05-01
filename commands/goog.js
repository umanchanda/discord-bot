const { SlashCommandBuilder } = require('@discordjs/builders');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function fetchGoogMessage() {
    const quote = await yahooFinance.quote('GOOGL');
    if (!quote || quote.regularMarketPrice == null) return null;
    const price = quote.regularMarketPrice.toFixed(2);
    const change = quote.regularMarketChange.toFixed(2);
    const changePct = quote.regularMarketChangePercent.toFixed(2);
    const sign = change >= 0 ? '+' : '';
    return `GOOGL: **$${price}** (${sign}${change}, ${sign}${changePct}%)`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('goog')
        .setDescription('Get the latest Google (GOOGL) stock price'),
    fetchGoogMessage,
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const msg = await fetchGoogMessage();
            if (!msg) return interaction.editReply('No GOOGL price data available right now.');
            return interaction.editReply(msg);
        } catch (err) {
            console.error('GOOG command error:', err);
            try { await interaction.editReply('Failed to fetch GOOGL price.'); } catch (e) {}
        }
    },
};
