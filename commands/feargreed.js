const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');

async function fetchFearGreedMessage() {
    const res = await axios.get('https://fear-and-greed-index.p.rapidapi.com/v1/fgi', {
        headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'fear-and-greed-index.p.rapidapi.com',
        },
    });
    const now = res.data?.fgi?.now;
    if (!now || now.value == null) return null;
    return `CNN Fear & Greed Index: **${now.value}/100** — **${now.valueText}**`;
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
