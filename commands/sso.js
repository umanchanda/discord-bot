const { SlashCommandBuilder } = require('@discordjs/builders');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function fetchSsoMessage() {
    const quote = await yahooFinance.quote('SSO');
    if (!quote || quote.regularMarketPrice == null) return null;
    const price = quote.regularMarketPrice.toFixed(2);
    const change = quote.regularMarketChange.toFixed(2);
    const changePct = quote.regularMarketChangePercent.toFixed(2);
    const sign = change >= 0 ? '+' : '';
    return `SSO: **$${price}** (${sign}${change}, ${sign}${changePct}%)`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sso')
        .setDescription('Get the latest SSO price'),
    fetchSsoMessage,
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const msg = await fetchSsoMessage();
            if (!msg) return interaction.editReply('No SSO price data available right now.');
            return interaction.editReply(msg);
        } catch (err) {
            console.error('SSO command error:', err);
            try { await interaction.editReply('Failed to fetch SSO price.'); } catch (e) {}
        }
    },
};
