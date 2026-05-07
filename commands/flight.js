const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

// IATA (2-letter, on tickets) → ICAO (3-letter, used in ADS-B callsigns)
const IATA_TO_ICAO = {
    AA: 'AAL', UA: 'UAL', DL: 'DAL', WN: 'SWA', B6: 'JBU',
    AS: 'ASA', F9: 'FFT', NK: 'NKS', G4: 'AAY', HA: 'HAL',
    SY: 'SCX', BA: 'BAW', LH: 'DLH', AF: 'AFR', KL: 'KLM',
    QR: 'QTR', EK: 'UAE', EY: 'ETD', SQ: 'SIA', AC: 'ACA',
    AM: 'AMX', LA: 'LAN', AV: 'AVA', CM: 'CMP', IB: 'IBE',
    VY: 'VLG', U2: 'EZY', FR: 'RYR', TK: 'THY', SK: 'SAS',
    AY: 'FIN', OS: 'AUA', LX: 'SWR', KE: 'KAL', OZ: 'AAR',
    CI: 'CAL', BR: 'EVA', TG: 'THA', AI: 'AIC', ET: 'ETH',
    QF: 'QFA', NZ: 'ANZ', CA: 'CCA', MU: 'CES', CZ: 'CSN',
    JL: 'JAL', NH: 'ANA',
};

// If the input looks like an IATA callsign (2 letters + digits), convert it
function resolveCallsign(input) {
    const match = input.match(/^([A-Z]{2})(\d+.*)$/);
    if (match && IATA_TO_ICAO[match[1]]) {
        return IATA_TO_ICAO[match[1]] + match[2];
    }
    return input;
}

async function fetchFlight(callsign) {
    const res = await axios.get(`https://api.airplanes.live/v2/callsign/${callsign}`);
    const aircraft = res.data?.ac;
    if (!aircraft || aircraft.length === 0) return null;
    return aircraft[0];
}

async function fetchRouteInfo(hex) {
    if (!process.env.RAPIDAPI_KEY) return null;
    try {
        const res = await axios.get(`https://aerodatabox.p.rapidapi.com/flights/icao24/${hex}`, {
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
            },
            timeout: 5000,
        });
        const flight = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!flight) return null;
        return {
            dep: flight.departure?.airport,
            arr: flight.arrival?.airport,
        };
    } catch {
        return null;
    }
}

async function reverseGeocode(lat, lon) {
    try {
        const res = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: { lat, lon, format: 'json', zoom: 10 },
            headers: { 'User-Agent': 'discord-bot/1.0' },
            timeout: 3000,
        });
        if (res.data?.error) return null;
        const a = res.data.address;
        const locality = a.city || a.town || a.village || a.county || null;
        const parts = [locality, a.state, a.country].filter(Boolean);
        return parts.length ? parts.join(', ') : null;
    } catch {
        return null;
    }
}

function formatAlt(alt) {
    if (alt == null) return 'N/A';
    if (alt === 'ground') return 'On ground';
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
                .setDescription('Callsign or flight number — e.g. UAL123, UA123, N12345')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const raw = interaction.options.getString('callsign').trim().toUpperCase().replace(/\s+/g, '');
        const callsign = resolveCallsign(raw);

        let ac;
        try {
            ac = await fetchFlight(callsign);
        } catch (err) {
            console.error('Flight command error:', err?.response?.data || err.message);
            return interaction.editReply('Failed to fetch flight data.');
        }

        if (!ac) {
            const hint = callsign !== raw ? ` (tried **${callsign}**)` : '';
            return interaction.editReply(
                `No active flight found for **${raw}**${hint}. The flight may not be airborne or visible to ADS-B receivers right now.`
            );
        }

        const alt = ac.alt_baro;
        const onGround = alt === 'ground';
        const gs = ac.gs != null ? `${Math.round(ac.gs)} kts` : 'N/A';
        const hasPos = ac.lat != null && ac.lon != null;
        const coords = hasPos ? `${ac.lat.toFixed(4)}°, ${ac.lon.toFixed(4)}°` : null;

        const [location, route] = await Promise.all([
            hasPos ? reverseGeocode(ac.lat, ac.lon).then(r => r ?? coords) : Promise.resolve('N/A'),
            ac.hex ? fetchRouteInfo(ac.hex) : Promise.resolve(null),
        ]);

        const formatAirport = (ap) => ap ? `${ap.name ?? '?'} (${ap.iata ?? ap.icao ?? '?'})` : null;
        const routeStr = (formatAirport(route?.dep) && formatAirport(route?.arr))
            ? `${formatAirport(route.dep)} → ${formatAirport(route.arr)}`
            : null;

        const fields = [
            { name: '📍 Location', value: location, inline: true },
            { name: '🛫 Altitude', value: formatAlt(alt), inline: true },
            { name: '💨 Ground Speed', value: gs, inline: true },
            { name: '🧭 Heading', value: formatHeading(ac.track), inline: true },
            { name: '📟 Squawk', value: ac.squawk || 'N/A', inline: true },
            { name: '🔑 ICAO Hex', value: ac.hex?.toUpperCase() || 'N/A', inline: true },
            { name: '📡 Source', value: ac.type || 'N/A', inline: true },
            { name: '🟢 Status', value: onGround ? 'On ground' : 'Airborne', inline: true },
        ];
        if (routeStr) fields.splice(1, 0, { name: '🗺️ Route', value: routeStr, inline: false });

        const embed = new EmbedBuilder()
            .setTitle(`✈️ ${(ac.flight || callsign).trim()}`)
            .addFields(...fields)
            .setColor(onGround ? 0x888888 : 0x00aaff)
            .setFooter({ text: 'Data via airplanes.live · Updates every ~500ms' });

        return interaction.editReply({ embeds: [embed] });
    },
};
