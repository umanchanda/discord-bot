const { SlashCommandBuilder } = require('@discordjs/builders');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function fetchTqqqMessage() {
    const quote = await yahooFinance.quote('TQQQ');
    if (!quote || quote.regularMarketPrice == null) return null;
    const price = quote.regularMarketPrice.toFixed(2);
    const change = quote.regularMarketChange.toFixed(2);
    const changePct = quote.regularMarketChangePercent.toFixed(2);
    const sign = change >= 0 ? '+' : '';
    return `TQQQ: **$${price}** (${sign}${change}, ${sign}${changePct}%)`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tqqq')
        .setDescription('Get the latest TQQQ price'),
    fetchTqqqMessage,
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const msg = await fetchTqqqMessage();
            if (!msg) return interaction.editReply('No TQQQ price data available right now.');
            return interaction.editReply(msg);
        } catch (err) {
            console.error('TQQQ command error:', err);
            try { await interaction.editReply('Failed to fetch TQQQ price.'); } catch (e) {}
        }
    },
};
