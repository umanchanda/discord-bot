const { SlashCommandBuilder } = require('@discordjs/builders');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function fetchWtiMessage() {
    const quote = await yahooFinance.quote('CL=F');
    if (!quote || quote.regularMarketPrice == null) return null;
    const price = quote.regularMarketPrice.toFixed(2);
    const change = quote.regularMarketChange.toFixed(2);
    const changePct = quote.regularMarketChangePercent.toFixed(2);
    const sign = change >= 0 ? '+' : '';
    return `WTI Crude Oil (CL=F): **$${price}/barrel** (${sign}${change}, ${sign}${changePct}%)`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wti')
        .setDescription('Get the latest WTI crude oil price (USD per barrel)'),
    fetchWtiMessage,
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const msg = await fetchWtiMessage();
            if (!msg) return interaction.editReply('No WTI price data available right now.');
            return interaction.editReply(msg);
        } catch (err) {
            console.error('WTI command error:', err);
            try { await interaction.editReply('Failed to fetch WTI price.'); } catch (e) {}
        }
    },
};
