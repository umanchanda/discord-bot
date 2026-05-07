const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

async function fetchFlight(callsign) {
    const res = await axios.get(`https://api.airplanes.live/v2/callsign/${callsign.toUpperCase()}`);
    const aircraft = res.data?.ac;
    if (!aircraft || aircraft.length === 0) return null;
    return aircraft[0];
}

function formatAlt(alt) {
    if (alt == null || alt === 'ground') return alt === 'ground' ? 'On ground' : 'N/A';
    return `${Number(alt).toLocaleString()} ft`;
}

function formatHeading(track) {
    if (track == null) return 'N/A';
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const dir = dirs[Math.round(track / 45) % 8];
    return `${track}° ${dir}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('flight')
        .setDescription('Track a live flight by callsign')
        .addStringOption(opt =>
            opt.setName('callsign')
                .setDescription('Radio callsign: airline + flight number (UAL123) or GA tail number (N12345)')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const callsign = interaction.options.getString('callsign').trim();

        let ac;
        try {
            ac = await fetchFlight(callsign);
        } catch (err) {
            console.error('Flight command error:', err?.response?.data || err.message);
            return interaction.editReply('Failed to fetch flight data. Check your `RAPIDAPI_KEY`.');
        }

        if (!ac) {
            return interaction.editReply(`No active flight found for callsign **${callsign.toUpperCase()}**.`);
        }

        const alt = ac.alt_baro;
        const onGround = alt === 'ground';
        const gs = ac.gs != null ? `${Math.round(ac.gs)} kts` : 'N/A';
        const pos = (ac.lat != null && ac.lon != null)
            ? `${ac.lat.toFixed(4)}°, ${ac.lon.toFixed(4)}°`
            : 'N/A';

        const embed = new EmbedBuilder()
            .setTitle(`✈️ ${(ac.flight || callsign).trim()}`)
            .addFields(
                { name: '📍 Position', value: pos, inline: true },
                { name: '🛫 Altitude', value: formatAlt(alt), inline: true },
                { name: '💨 Ground Speed', value: gs, inline: true },
                { name: '🧭 Heading', value: formatHeading(ac.track), inline: true },
                { name: '📟 Squawk', value: ac.squawk || 'N/A', inline: true },
                { name: '🔑 ICAO Hex', value: ac.hex?.toUpperCase() || 'N/A', inline: true },
                { name: '📡 Source', value: ac.type || 'N/A', inline: true },
                { name: '🟢 Status', value: onGround ? 'On ground' : 'Airborne', inline: true },
            )
            .setColor(onGround ? 0x888888 : 0x00aaff)
            .setFooter({ text: 'Data via ADS-B Exchange · Updates every ~500ms' });

        return interaction.editReply({ embeds: [embed] });
    },
};
