const { SlashCommandBuilder } = require('@discordjs/builders');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('btc')
        .setDescription('Get the latest Bitcoin price'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const quote = await yahooFinance.quote('BTC-USD');
            if (!quote || quote.regularMarketPrice == null) {
                return interaction.editReply('No Bitcoin price data available right now.');
            }
            const price = quote.regularMarketPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const change = quote.regularMarketChange.toFixed(2);
            const changePct = quote.regularMarketChangePercent.toFixed(2);
            const sign = change >= 0 ? '+' : '';
            return interaction.editReply(`Bitcoin Price: **$${price}** (${sign}${change}, ${sign}${changePct}%)`);
        } catch (err) {
            console.error('Bitcoin command error:', err);
            try { await interaction.editReply('Failed to fetch Bitcoin price.'); } catch (e) {}
        }
    },
};
