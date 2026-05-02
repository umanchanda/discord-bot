const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');

async function fetchGasMessage() {
    const { data: html } = await axios.get('https://gasprices.aaa.com/', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        },
    });
    const match = html.match(/National Average[\s\S]*?\$(\d+\.\d+)/);
    if (!match) return null;
    return `AAA National Average Gas Price: **$${match[1]}/gallon**`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gas')
        .setDescription('Get the latest AAA national average gas price'),
    fetchGasMessage,
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const msg = await fetchGasMessage();
            if (!msg) return interaction.editReply('No gas price data available right now.');
            return interaction.editReply(msg);
        } catch (err) {
            console.error('Gas command error:', err);
            try { await interaction.editReply('Failed to fetch gas price.'); } catch (e) {}
        }
    },
};
