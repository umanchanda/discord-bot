const { SlashCommandBuilder } = require('@discordjs/builders');
const yahooFinance = require('yahoo-finance2').default;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wti')
        .setDescription('Get the latest WTI crude oil price (USD per barrel)'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const quote = await yahooFinance.quote('CL=F');
            if (!quote || quote.regularMarketPrice == null) {
                return interaction.editReply('No WTI price data available right now.');
            }
            const price = quote.regularMarketPrice.toFixed(2);
            const change = quote.regularMarketChange.toFixed(2);
            const changePct = quote.regularMarketChangePercent.toFixed(2);
            const sign = change >= 0 ? '+' : '';
            return interaction.editReply(`WTI Crude Oil (CL=F): **$${price}/barrel** (${sign}${change}, ${sign}${changePct}%)`);
        } catch (err) {
            console.error('WTI command error:', err);
            try { await interaction.editReply('Failed to fetch WTI price.'); } catch (e) {}
        }
    },
};
