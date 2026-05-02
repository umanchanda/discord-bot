const { SlashCommandBuilder } = require('@discordjs/builders');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function fetchBrentMessage() {
    const quote = await yahooFinance.quote('BZ=F');
    if (!quote || quote.regularMarketPrice == null) return null;
    const price = quote.regularMarketPrice.toFixed(2);
    const change = quote.regularMarketChange.toFixed(2);
    const changePct = quote.regularMarketChangePercent.toFixed(2);
    const sign = change >= 0 ? '+' : '';
    return `Brent Crude Oil (BZ=F): **$${price}/barrel** (${sign}${change}, ${sign}${changePct}%)`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('brent')
        .setDescription('Get the latest Brent crude oil price (USD per barrel)'),
    fetchBrentMessage,
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const msg = await fetchBrentMessage();
            if (!msg) return interaction.editReply('No Brent price data available right now.');
            return interaction.editReply(msg);
        } catch (err) {
            console.error('Brent command error:', err);
            try { await interaction.editReply('Failed to fetch Brent price.'); } catch (e) {}
        }
    },
};
