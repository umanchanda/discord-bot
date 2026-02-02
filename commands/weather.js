const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Get current weather for a US zip code')
        .addStringOption(opt => opt.setName('zip').setDescription('5-digit US zip code').setRequired(true)),
    async execute(interaction) {
        const zip = interaction.options.getString('zip');
        const apiKey = process.env.WEATHER_API_KEY;
        if (!apiKey) {
            return interaction.reply({ content: 'Weather API key not configured. Set WEATHER_API_KEY in .env', ephemeral: true });
        }
        await interaction.deferReply();
        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?zip=${encodeURIComponent(zip)}&appid=${apiKey}`);
            if (!res.ok) {
                const txt = await res.text();
                return interaction.editReply(`Weather API error: ${res.status} ${txt}`);
            }
            const body = await res.json();
            if (!body || !body.list || body.list.length === 0) {
                return interaction.editReply('No weather data found for that zip code.');
            }
            const kelvin = parseFloat(body.list[0].main.temp);
            const fahrenheit = ((kelvin - 273.15) * 9/5 + 32).toFixed(1);
            const city = body.city && body.city.name ? body.city.name : 'unknown location';
            return interaction.editReply(`The temperature is ${fahrenheit}°F — location: ${city}`);
        } catch (err) {
            console.error('Weather command error:', err);
            try { await interaction.editReply('Failed to fetch weather.'); } catch (e) {}
        }
    },
};
