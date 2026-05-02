const { SlashCommandBuilder } = require('@discordjs/builders');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function fetchSp500Message() {
    const quote = await yahooFinance.quote('^GSPC');
    if (!quote || quote.regularMarketPrice == null) return null;
    const price = quote.regularMarketPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const change = quote.regularMarketChange.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const changePct = quote.regularMarketChangePercent.toFixed(2);
    const sign = change >= 0 ? '+' : '';
    return `S&P 500: **${price}** (${sign}${change}, ${sign}${changePct}%)`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sp500')
        .setDescription('Get the latest S&P 500 price'),
    fetchSp500Message,
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const msg = await fetchSp500Message();
            if (!msg) return interaction.editReply('No S&P 500 price data available right now.');
            return interaction.editReply(msg);
        } catch (err) {
            console.error('SP500 command error:', err);
            try { await interaction.editReply('Failed to fetch S&P 500 price.'); } catch (e) {}
        }
    },
};
