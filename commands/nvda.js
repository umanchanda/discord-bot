const { SlashCommandBuilder } = require('@discordjs/builders');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nvda')
        .setDescription('Get the latest NVIDIA stock price'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const quote = await yahooFinance.quote('NVDA');
            if (!quote || quote.regularMarketPrice == null) {
                return interaction.editReply('No NVIDIA stock price data available right now.');
            }
            const price = quote.regularMarketPrice.toFixed(2);
            const change = quote.regularMarketChange.toFixed(2);
            const changePct = quote.regularMarketChangePercent.toFixed(2);
            const sign = change >= 0 ? '+' : '';
            return interaction.editReply(`NVIDIA (NVDA): **$${price}** (${sign}${change}, ${sign}${changePct}%)`);
        } catch (err) {
            console.error('NVDA command error:', err);
            try { await interaction.editReply('Failed to fetch NVIDIA stock price.'); } catch (e) {}
        }
    },
};
