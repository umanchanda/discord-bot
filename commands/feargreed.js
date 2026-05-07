const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');

async function fetchFearGreedMessage() {
    const res = await axios.get('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const data = res.data?.fear_and_greed;
    if (!data || data.score == null) return null;
    const score = Math.round(data.score);
    const rating = data.rating;
    return `CNN Fear & Greed Index: **${score}/100** — **${rating}**`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('feargreed')
        .setDescription('Get the current CNN Fear & Greed Index'),
    fetchFearGreedMessage,
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const msg = await fetchFearGreedMessage();
            if (!msg) return interaction.editReply('No Fear & Greed data available right now.');
            return interaction.editReply(msg);
        } catch (err) {
            console.error('Fear & Greed command error:', err);
            try { await interaction.editReply('Failed to fetch Fear & Greed Index.'); } catch (e) {}
        }
    },
};
