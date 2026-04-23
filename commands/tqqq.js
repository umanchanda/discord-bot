const { SlashCommandBuilder } = require('@discordjs/builders');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tqqq')
        .setDescription('Get the latest TQQQ ETF price'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const quote = await yahooFinance.quote('TQQQ');
            if (!quote || quote.regularMarketPrice == null) {
                return interaction.editReply('No TQQQ ETF price data available right now.');
            }
            const price = quote.regularMarketPrice.toFixed(2);
            const change = quote.regularMarketChange.toFixed(2);
            const changePct = quote.regularMarketChangePercent.toFixed(2);
            const sign = change >= 0 ? '+' : '';
            return interaction.editReply(`TQQQ ETF (TQQQ): **$${price}** (${sign}${change}, ${sign}${changePct}%)`);
        } catch (err) {
            console.error('TQQQ command error:', err);
            try { await interaction.editReply('Failed to fetch TQQQ ETF price.'); } catch (e) {}
        }
    },
};
