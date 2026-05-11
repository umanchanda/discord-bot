const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

const API = process.env.FLIGHT_DIARY_API_URL || 'https://flight-data-26kb.onrender.com';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('diary')
        .setDescription('Personal flight diary stats')
        .addSubcommand(sub =>
            sub.setName('stats')
                .setDescription('Overall flight stats')
        )
        .addSubcommand(sub =>
            sub.setName('flights')
                .setDescription('Recent flights')
                .addStringOption(opt =>
                    opt.setName('airline')
                        .setDescription('Filter by airline name')
                        .setRequired(false)
                )
                .addStringOption(opt =>
                    opt.setName('aircraft')
                        .setDescription('Filter by aircraft type e.g. 737-800')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('registration')
                .setDescription('Look up an aircraft registration')
                .addStringOption(opt =>
                    opt.setName('reg')
                        .setDescription('Registration e.g. N8670A')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const sub = interaction.options.getSubcommand();

        try {
            if (sub === 'stats') {
                const [statsRes, aircraftRes, airportsRes] = await Promise.all([
                    axios.get(`${API}/stats`),
                    axios.get(`${API}/aircraft`),
                    axios.get(`${API}/airports`),
                ]);

                const s = statsRes.data;
                const topAircraft = aircraftRes.data.slice(0, 3)
                    .map(a => `${a.aircraft} (${a.flights} flights)`)
                    .join('\n');
                const topAirports = airportsRes.data.slice(0, 3)
                    .map(a => `${a.name} (${a.total_visits} visits)`)
                    .join('\n');

                const embed = new EmbedBuilder()
                    .setTitle('✈️ Flight Diary — Stats')
                    .setColor(0x00aaff)
                    .addFields(
                        { name: '🛫 Total Flights', value: `${s.total_flights}`, inline: true },
                        { name: '⏱️ Hours Flown', value: `${s.total_hours.toLocaleString()} h`, inline: true },
                        { name: '🏢 Airlines', value: `${s.unique_airlines}`, inline: true },
                        { name: '🗺️ Airports', value: `${s.unique_airports}`, inline: true },
                        { name: '✈️ Top Aircraft', value: topAircraft || 'N/A', inline: false },
                        { name: '🏙️ Top Airports', value: topAirports || 'N/A', inline: false },
                    );

                return interaction.editReply({ embeds: [embed] });
            }

            if (sub === 'flights') {
                const airline = interaction.options.getString('airline') || null;
                const aircraft = interaction.options.getString('aircraft') || null;

                const params = { limit: 5 };
                if (airline) params.airline = airline;
                if (aircraft) params.aircraft = aircraft;

                const res = await axios.get(`${API}/flights`, { params });
                const flights = res.data;

                if (!flights.length) {
                    return interaction.editReply('No flights found matching those filters.');
                }

                const lines = flights.map(f => {
                    const date = f.date ?? '?';
                    const route = `${f.from_airport.match(/\(([A-Z]{3})\//)?.[1] ?? '?'} → ${f.to_airport.match(/\(([A-Z]{3})\//)?.[1] ?? '?'}`;
                    const hrs = f.duration_minutes ? `${(f.duration_minutes / 60).toFixed(1)}h` : '?';
                    return `**${date}** · ${f.flight_number ?? '—'} · ${route} · ${hrs} · ${f.airline.split(' (')[0]}`;
                });

                const filterDesc = [
                    airline && `airline: *${airline}*`,
                    aircraft && `aircraft: *${aircraft}*`,
                ].filter(Boolean).join(', ');

                const embed = new EmbedBuilder()
                    .setTitle(`✈️ Recent Flights${filterDesc ? ` — ${filterDesc}` : ''}`)
                    .setColor(0x00aaff)
                    .setDescription(lines.join('\n'))
                    .setFooter({ text: 'Showing up to 5 most recent' });

                return interaction.editReply({ embeds: [embed] });
            }

            if (sub === 'registration') {
                const reg = interaction.options.getString('reg').trim().toUpperCase();
                const res = await axios.get(`${API}/registrations/${reg}`);
                const { meta, flights } = res.data;

                if (!meta && !flights.length) {
                    return interaction.editReply(`No data found for registration **${reg}**.`);
                }

                const fields = [];
                if (meta) {
                    fields.push(
                        { name: '🏭 Manufacturer', value: meta.manufacturer ?? '—', inline: true },
                        { name: '✈️ Model', value: meta.model ?? '—', inline: true },
                        { name: '🏢 Operator', value: meta.operator ?? '—', inline: true },
                        { name: '🌍 Country', value: meta.country ?? '—', inline: true },
                        { name: '📡 Mode-S', value: meta.mode_s ?? '—', inline: true },
                    );
                }

                fields.push({ name: '🛫 Your Flights on This Aircraft', value: `${flights.length}`, inline: true });

                if (flights.length) {
                    const latest = flights[0];
                    const route = `${latest.from_airport.match(/\(([A-Z]{3})\//)?.[1] ?? '?'} → ${latest.to_airport.match(/\(([A-Z]{3})\//)?.[1] ?? '?'}`;
                    fields.push({
                        name: '🕐 Last Flown',
                        value: `${latest.date} · ${latest.flight_number ?? '—'} · ${route}`,
                        inline: false,
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle(`🔍 Registration: ${reg}`)
                    .setColor(0x00aaff)
                    .addFields(...fields);

                if (meta?.photo_thumbnail_url) {
                    embed.setThumbnail(meta.photo_thumbnail_url);
                }

                return interaction.editReply({ embeds: [embed] });
            }

        } catch (err) {
            console.error('diary command error:', err?.response?.data || err.message);
            return interaction.editReply('Failed to fetch flight diary data. The API may be waking up — try again in a moment.');
        }
    },
};
