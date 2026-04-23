const { SlashCommandBuilder } = require('@discordjs/builders');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function fetchBtcMessage() {
    const quote = await yahooFinance.quote('BTC-USD');
    if (!quote || quote.regularMarketPrice == null) return null;
    const price = quote.regularMarketPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const change = quote.regularMarketChange.toFixed(2);
    const changePct = quote.regularMarketChangePercent.toFixed(2);
    const sign = change >= 0 ? '+' : '';
    return `Bitcoin Price: **$${price}** (${sign}${change}, ${sign}${changePct}%)`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('btc')
        .setDescription('Get the latest Bitcoin price'),
    fetchBtcMessage,
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const msg = await fetchBtcMessage();
            if (!msg) return interaction.editReply('No Bitcoin price data available right now.');
            return interaction.editReply(msg);
        } catch (err) {
            console.error('Bitcoin command error:', err);
            try { await interaction.editReply('Failed to fetch Bitcoin price.'); } catch (e) {}
        }
    },
};
