const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

const CATEGORY_EMOJI = {
    widebody: '🛬',
    narrowbody: '✈️',
    regional: '🛩️',
    turboprop: '🚁',
};

function formatAircraft(ac) {
    const emoji = CATEGORY_EMOJI[(ac.category || '').toLowerCase()] || '✈️';
    const codes = [ac.iata, ac.icao].filter(Boolean).join(' / ');
    const header = [`${emoji} **${ac.type || 'Unknown'}**`, codes && `(${codes})`].filter(Boolean).join(' ');
    const lines = [header];
    if (ac.category) lines.push(`Category: ${ac.category}`);
    if (ac.era) lines.push(`Era: ${ac.era}`);
    if (ac.airlines && ac.airlines.length) lines.push(`Airlines: ${ac.airlines.join(', ')}`);
    if (ac.estimated_fuel_liters != null) {
        lines.push(`Estimated fuel: ${Math.round(ac.estimated_fuel_liters).toLocaleString()} L`);
    }
    if (ac.estimated_fuel_cost_usd != null) {
        lines.push(`Estimated fuel cost: $${Number(ac.estimated_fuel_cost_usd).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
    }
    if (ac.notes) lines.push(`_${ac.notes}_`);
    return lines.join('\n');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('routeanalyzer')
        .setDescription('Analyze which aircraft fly a route between two airports')
        .addStringOption(opt =>
            opt.setName('origin')
                .setDescription('Origin airport code — e.g. JFK, LAX')
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('destination')
                .setDescription('Destination airport code — e.g. LHR, NRT')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const origin = interaction.options.getString('origin').trim().toUpperCase();
        const destination = interaction.options.getString('destination').trim().toUpperCase();

        let data;
        try {
            const res = await axios.get(
                `https://route-analyzer-nfu1.onrender.com/aircraft/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`,
                { timeout: 30000 }
            );
            data = res.data;
        } catch (err) {
            console.error('Route analyzer command error:', err?.response?.data || err.message);
            if (err?.response?.status === 404) {
                return interaction.editReply(`No route data found for **${origin} → ${destination}**.`);
            }
            return interaction.editReply('Failed to fetch route data. The service may be waking up — try again in a moment.');
        }

        if (!data || data.routeExists === false) {
            const notes = data?.routeNotes ? `\n${data.routeNotes}` : '';
            return interaction.editReply(`No known route exists between **${origin} → ${destination}**.${notes}`);
        }

        const originName = data.originName || origin;
        const destName = data.destName || destination;

        const embed = new EmbedBuilder()
            .setTitle(`🗺️ ${originName} → ${destName}`)
            .setColor(0x00aaff)
            .setFooter({ text: 'Data via route-analyzer' });

        if (data.distance_km != null) {
            embed.addFields({
                name: '📏 Distance',
                value: `${Math.round(data.distance_km).toLocaleString()} km`,
                inline: true,
            });
        }

        if (data.jetFuelPriceUsdPerLiter != null) {
            embed.addFields({
                name: '⛽ Jet fuel price',
                value: `$${Number(data.jetFuelPriceUsdPerLiter).toFixed(2)} / L`,
                inline: true,
            });
        }

        const aircraft = Array.isArray(data.aircraft) ? data.aircraft : [];
        if (aircraft.length) {
            // Discord embed field values cap at 1024 chars; split across fields if needed.
            let buffer = [];
            let length = 0;
            let fieldIndex = 0;
            const flush = () => {
                if (!buffer.length) return;
                embed.addFields({
                    name: fieldIndex === 0 ? `🛫 Aircraft (${aircraft.length})` : '​',
                    value: buffer.join('\n\n'),
                });
                buffer = [];
                length = 0;
                fieldIndex++;
            };
            for (const ac of aircraft) {
                const block = formatAircraft(ac);
                if (length + block.length + 2 > 1024 && buffer.length) flush();
                buffer.push(block);
                length += block.length + 2;
            }
            flush();
        } else {
            embed.addFields({ name: '🛫 Aircraft', value: 'No aircraft data available for this route.' });
        }

        if (data.routeNotes) {
            embed.setDescription(data.routeNotes);
        }

        if (data.pricingNotes) {
            embed.addFields({ name: '💡 Pricing notes', value: data.pricingNotes });
        }

        return interaction.editReply({ embeds: [embed] });
    },
};
