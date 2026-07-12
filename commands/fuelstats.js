const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

const API_URL = 'https://flight-fuel-stats.onrender.com/v1/fuel/by-route';
const ROUTING_FACTOR = 1.06;
const CONTINGENCY_PCT = 0.05;

function normalizeCode(code) {
    return code.trim().toUpperCase();
}

function formatKg(value) {
    if (value == null || Number.isNaN(Number(value))) return 'N/A';
    return `${Math.round(Number(value)).toLocaleString()} kg`;
}

function formatKgAndTons(value) {
    if (value == null || Number.isNaN(Number(value))) return 'N/A';
    const kg = Number(value);
    const tonnes = kg / 1000;
    return `${Math.round(kg).toLocaleString()} kg (${tonnes.toFixed(2)} t)`;
}

function buildEstimateLine(estimate) {
    const aircraft = estimate.aircraft_type || estimate.aircraft_name || 'Unknown aircraft';
    const distance = estimate.distance_nm != null ? `${Math.round(estimate.distance_nm).toLocaleString()} nm` : 'N/A';
    const blockTime = estimate.block_time_min != null ? `${Math.round(estimate.block_time_min)} min` : 'N/A';
    const totalFuel = formatKgAndTons(estimate.fuel_kg?.total_kg);

    return `**${aircraft}** - ${totalFuel} (Distance: ${distance}, Block: ${blockTime})`;
}

function buildAssumptionsText(assumptions) {
    if (!assumptions || typeof assumptions !== 'object') return 'N/A';
    const entries = Object.entries(assumptions);
    if (!entries.length) return 'N/A';
    return entries.map(([k, v]) => `${k}: ${v}`).join(' | ');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fuel')
        .setDescription('Fuel planning utilities')
        .addSubcommand(sub =>
            sub.setName('stats')
                .setDescription('Estimate fuel burn by route')
                .addStringOption(opt =>
                    opt.setName('origin')
                        .setDescription('Origin airport code (e.g. JFK or KJFK)')
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('destination')
                        .setDescription('Destination airport code (e.g. LAX or KLAX)')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub !== 'stats') {
            return interaction.reply({ content: 'Unknown fuel subcommand.', ephemeral: true });
        }

        await interaction.deferReply();

        const origin = normalizeCode(interaction.options.getString('origin'));
        const destination = normalizeCode(interaction.options.getString('destination'));

        if (!/^[A-Z]{3,4}$/.test(origin) || !/^[A-Z]{3,4}$/.test(destination)) {
            return interaction.editReply('Please provide valid airport codes (3-4 letters).');
        }

        try {
            const response = await axios.get(API_URL, {
                params: {
                    origin,
                    destination,
                    routing_factor: ROUTING_FACTOR,
                    contingency_pct: CONTINGENCY_PCT,
                },
                timeout: 15000,
            });

            const data = response.data || {};
            const estimates = Array.isArray(data.estimates) ? data.estimates : [];

            if (!estimates.length) {
                return interaction.editReply(`No fuel estimates found for **${origin} -> ${destination}**.`);
            }

            const sorted = [...estimates].sort((a, b) => {
                const aTotal = Number(a?.fuel_kg?.total_kg ?? Number.POSITIVE_INFINITY);
                const bTotal = Number(b?.fuel_kg?.total_kg ?? Number.POSITIVE_INFINITY);
                return aTotal - bTotal;
            });

            const estimateLines = sorted.slice(0, 10).map(buildEstimateLine);
            const assumptionsText = buildAssumptionsText(data.assumptions);

            const embed = new EmbedBuilder()
                .setTitle(`Fuel Stats: ${data.origin || origin} -> ${data.destination || destination}`)
                .setColor(0x00aaff)
                .addFields(
                    { name: 'Assumptions', value: assumptionsText, inline: false },
                    { name: `Estimates (${sorted.length})`, value: estimateLines.join('\n'), inline: false }
                )
                .setFooter({
                    text: `routing_factor=${ROUTING_FACTOR} | contingency_pct=${CONTINGENCY_PCT}`,
                });

            if (sorted.length > 10) {
                embed.addFields({
                    name: 'Note',
                    value: `Showing top 10 by total fuel (out of ${sorted.length}).`,
                    inline: false,
                });
            }

            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error('fuel stats command error:', err?.response?.data || err.message);
            return interaction.editReply('Failed to fetch fuel stats. Please try again in a moment.');
        }
    },
};
