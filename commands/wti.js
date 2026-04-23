const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wti')
        .setDescription('Get the latest WTI crude oil spot price (USD per barrel)'),
    async execute(interaction) {
        const apiKey = process.env.EIA_API_KEY;
        if (!apiKey) {
            return interaction.reply({ content: 'EIA API key not configured. Set EIA_API_KEY in .env', ephemeral: true });
        }
        await interaction.deferReply();
        try {
            const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?frequency=daily&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=1&facets[series][]=RWTC&api_key=${apiKey}`;
            const res = await fetch(url);
            if (!res.ok) {
                const txt = await res.text();
                return interaction.editReply(`EIA API error: ${res.status} ${txt}`);
            }
            const body = await res.json();
            const entry = body?.response?.data?.[0];
            if (!entry || entry.value == null) {
                return interaction.editReply('No WTI price data available right now.');
            }
            const price = parseFloat(entry.value).toFixed(2);
            const date = entry.period;
            return interaction.editReply(`WTI Crude Oil: **$${price}/barrel** (as of ${date})`);
        } catch (err) {
            console.error('WTI command error:', err);
            try { await interaction.editReply('Failed to fetch WTI price.'); } catch (e) {}
        }
    },
};
