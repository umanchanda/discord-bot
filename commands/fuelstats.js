const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

const API_URL = 'https://flight-fuel-stats.onrender.com/v1/fuel/by-route';
const ROUTING_FACTOR = 1.06;
const CONTINGENCY_PCT = 0.05;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set([
    'ECONNABORTED',
    'ECONNRESET',
    'ETIMEDOUT',
    'EAI_AGAIN',
]);

function normalizeCode(code) {
    return code.trim().toUpperCase();
}

function formatTonnes(value) {
    if (value == null || Number.isNaN(Number(value))) return 'N/A';
    return `${Number(value).toFixed(2)} t`;
}

function formatBreakdown(fuelTons) {
    if (!fuelTons || typeof fuelTons !== 'object') return 'N/A';

    return [
        `Taxi: ${formatTonnes(fuelTons.taxi_tons)}`,
        `Trip: ${formatTonnes(fuelTons.trip_tons)}`,
        `Contingency: ${formatTonnes(fuelTons.contingency_tons)}`,
        `Reserve: ${formatTonnes(fuelTons.reserve_tons)}`,
        `Total: ${formatTonnes(fuelTons.total_tons)}`,
    ].join(' | ');
}

function getTotalTons(estimate) {
    const totalTons = estimate?.fuel_tons?.total_tons;
    if (totalTons != null && !Number.isNaN(Number(totalTons))) return Number(totalTons);

    const totalKg = estimate?.fuel_tons?.total_kg;
    if (totalKg != null && !Number.isNaN(Number(totalKg))) return Number(totalKg) / 1000;

    return null;
}

function buildEstimateLine(estimate) {
    const aircraftType = estimate.aircraft_type || null;
    const aircraftName = estimate.aircraft_name || null;
    const aircraft = aircraftType && aircraftName ? `${aircraftType} (${aircraftName})` : (aircraftType || aircraftName || 'Unknown aircraft');
    const distance = estimate.distance_nm != null ? `${Math.round(estimate.distance_nm).toLocaleString()} nm` : 'N/A';
    const blockTime = estimate.block_time_min != null ? `${Math.round(estimate.block_time_min)} min` : 'N/A';
    const totalFuel = formatTonnes(getTotalTons(estimate));
    const breakdown = formatBreakdown(estimate.fuel_tons);

    return `**${aircraft}** - ${totalFuel} (Distance: ${distance}, Block: ${blockTime})\n${breakdown}`;
}

function buildAssumptionsText(assumptions) {
    if (!assumptions || typeof assumptions !== 'object') return 'N/A';
    const entries = Object.entries(assumptions);
    if (!entries.length) return 'N/A';
    const labelMap = {
        routing_factor: 'Routing factor',
        contingency_pct: 'Contingency pct',
        payload_kg: 'Payload',
    };

    return entries.map(([k, v]) => {
        const label = labelMap[k] || k;
        if (k === 'payload_kg' && v != null && !Number.isNaN(Number(v))) {
            return `${label}: ${Number(v).toLocaleString()} kg`;
        }
        return `${label}: ${v}`;
    }).join(' | ');
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableRequestError(err) {
    const status = err?.response?.status;
    if (status && RETRYABLE_STATUS.has(status)) return true;

    return RETRYABLE_ERROR_CODES.has(err?.code);
}

async function fetchFuelStats(origin, destination) {
    let attempt = 0;

    while (true) {
        try {
            return await axios.get(API_URL, {
                params: {
                    origin,
                    destination,
                    routing_factor: ROUTING_FACTOR,
                    contingency_pct: CONTINGENCY_PCT,
                },
                timeout: REQUEST_TIMEOUT_MS,
            });
        } catch (err) {
            if (!isRetryableRequestError(err) || attempt >= MAX_RETRIES) {
                throw err;
            }

            attempt += 1;
            await wait(300 * attempt);
        }
    }
}

function buildEstimateFields(lines, totalCount) {
    const MAX_FIELD_VALUE_LEN = 1024;
    if (!Array.isArray(lines) || !lines.length) {
        return [{ name: `Estimates (${totalCount})`, value: 'N/A', inline: false }];
    }

    const chunks = [];
    let current = '';

    for (const rawLine of lines) {
        const line = String(rawLine || '');
        if (!line) continue;

        if (line.length > MAX_FIELD_VALUE_LEN) {
            const truncated = `${line.slice(0, MAX_FIELD_VALUE_LEN - 3)}...`;
            if (current) {
                chunks.push(current);
                current = '';
            }
            chunks.push(truncated);
            continue;
        }

        const candidate = current ? `${current}\n${line}` : line;
        if (candidate.length <= MAX_FIELD_VALUE_LEN) {
            current = candidate;
        } else {
            chunks.push(current);
            current = line;
        }
    }

    if (current) chunks.push(current);

    return chunks.map((value, idx) => ({
        name: idx === 0 ? `Estimates (${totalCount})` : `Estimates (cont. ${idx + 1}/${chunks.length})`,
        value,
        inline: false,
    }));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fuelstats')
        .setDescription('Estimate fuel burn by route')
        .addStringOption(opt =>
            opt.setName('origin')
                .setDescription('Origin IATA airport code (e.g. JFK)')
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('destination')
                .setDescription('Destination IATA airport code (e.g. LAX)')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const origin = normalizeCode(interaction.options.getString('origin'));
        const destination = normalizeCode(interaction.options.getString('destination'));

        if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
            return interaction.editReply('Please provide valid 3-letter IATA airport codes (for example: ORD, EWR).');
        }

        try {
            const response = await fetchFuelStats(origin, destination);

            const data = response.data || {};
            const estimates = Array.isArray(data.estimates) ? data.estimates : [];

            if (!estimates.length) {
                return interaction.editReply(`No fuel estimates found for **${origin} -> ${destination}**.`);
            }

            const sorted = [...estimates].sort((a, b) => {
                const aTotal = getTotalTons(a) ?? Number.POSITIVE_INFINITY;
                const bTotal = getTotalTons(b) ?? Number.POSITIVE_INFINITY;
                return aTotal - bTotal;
            });

            const estimateLines = sorted.slice(0, 10).map(buildEstimateLine);
            const assumptionsText = buildAssumptionsText(data.assumptions);
            const estimateFields = buildEstimateFields(estimateLines, sorted.length);

            const embed = new EmbedBuilder()
                .setTitle(`Fuel Stats: ${data.origin || origin} -> ${data.destination || destination}`)
                .setColor(0x00aaff)
                .addFields(
                    { name: 'Assumptions', value: assumptionsText, inline: false },
                    ...estimateFields
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
            const status = err?.response?.status;
            const detail = err?.response?.data?.detail;
            console.error('fuel stats command error:', status, detail || err.message);

            if (status === 404 && typeof detail === 'string' && detail.includes('Unknown')) {
                return interaction.editReply(`API could not find one of the airports for **${origin} -> ${destination}**. Please use 3-letter IATA codes (for example: ORD, EWR).`);
            }

            if (status === 502 && typeof detail === 'string') {
                return interaction.editReply(`Fuel stats API could not provide data for **${origin} -> ${destination}** right now (${detail}). Please try another route or retry shortly.`);
            }

            if (err.code === 'ECONNABORTED') {
                return interaction.editReply('Fuel stats request timed out. Please try again in a moment.');
            }

            return interaction.editReply('Failed to fetch fuel stats. Please try again in a moment.');
        }
    },
};
