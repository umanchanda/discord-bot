const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const axios = require('axios');

const API = process.env.FLIGHT_DIARY_API_URL || 'https://flight-data-26kb.onrender.com';
const PAGE_SIZE = 10;

function formatLine(f) {
    const date = f.date ?? '?';
    const route = `${f.from_airport.match(/\(([A-Z]{3})\//)?.[1] ?? '?'} → ${f.to_airport.match(/\(([A-Z]{3})\//)?.[1] ?? '?'}`;
    const hrs = f.duration_minutes ? `${(f.duration_minutes / 60).toFixed(1)}h` : '?';
    return `**${date}** · ${f.flight_number ?? '—'} · ${route} · ${hrs} · ${f.airline.split(' (')[0]}`;
}

async function paginate(interaction, lines, title) {
    const totalPages = Math.ceil(lines.length / PAGE_SIZE);

    const buildEmbed = (page) => new EmbedBuilder()
        .setTitle(title)
        .setColor(0x00aaff)
        .setDescription(lines.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).join('\n'))
        .setFooter({ text: `Page ${page + 1}/${totalPages} · ${lines.length} flights` });

    const buildRow = (page) => new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('prev').setLabel('◀ Prev').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId('next').setLabel('Next ▶').setStyle(ButtonStyle.Secondary).setDisabled(page === totalPages - 1),
    );

    if (totalPages === 1) {
        return interaction.editReply({ embeds: [buildEmbed(0)], components: [], content: null });
    }

    let page = 0;
    const msg = await interaction.editReply({ embeds: [buildEmbed(0)], components: [buildRow(0)], content: null });

    const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: i => i.user.id === interaction.user.id,
        idle: 60_000,
    });

    collector.on('collect', async btn => {
        if (btn.customId === 'prev') page--;
        if (btn.customId === 'next') page++;
        await btn.update({ embeds: [buildEmbed(page)], components: [buildRow(page)] });
    });

    collector.on('end', () => {
        interaction.editReply({ components: [] }).catch(() => {});
    });
}

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
                .setDescription('All flights, paginated')
        )
        .addSubcommand(sub =>
            sub.setName('years')
                .setDescription('All flights in a given year')
                .addIntegerOption(opt =>
                    opt.setName('year')
                        .setDescription('Year to filter by e.g. 2024')
                        .setRequired(true)
                        .setMinValue(1900)
                        .setMaxValue(2100)
                )
        )
        .addSubcommand(sub =>
            sub.setName('airlines')
                .setDescription('All flights for a selected airline')
        )
        .addSubcommand(sub =>
            sub.setName('registration')
                .setDescription('Look up an aircraft registration')
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
                    .map(a => `${a.aircraft} (${a.flights} flights)`).join('\n');
                const topAirports = airportsRes.data.slice(0, 3)
                    .map(a => `${a.name} (${a.total_visits} visits)`).join('\n');

                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setTitle('✈️ Flight Diary — Stats')
                        .setColor(0x00aaff)
                        .addFields(
                            { name: '🛫 Total Flights', value: `${s.total_flights}`, inline: true },
                            { name: '⏱️ Hours Flown', value: `${s.total_hours.toLocaleString()} h`, inline: true },
                            { name: '🏢 Airlines', value: `${s.unique_airlines}`, inline: true },
                            { name: '🗺️ Airports', value: `${s.unique_airports}`, inline: true },
                            { name: '✈️ Top Aircraft', value: topAircraft || 'N/A', inline: false },
                            { name: '🏙️ Top Airports', value: topAirports || 'N/A', inline: false },
                        )],
                });
            }

            if (sub === 'flights') {
                const res = await axios.get(`${API}/flights`, { params: { limit: 1000 } });
                const flights = res.data;
                if (!flights.length) return interaction.editReply('No flights found.');
                return paginate(interaction, flights.map(formatLine), '✈️ All Flights');
            }

            if (sub === 'years') {
                const year = interaction.options.getInteger('year');
                const res = await axios.get(`${API}/flights`, { params: { limit: 1000, year } });
                const flights = res.data;
                if (!flights.length) return interaction.editReply(`No flights found for ${year}.`);
                return paginate(interaction, flights.map(formatLine), `✈️ Flights in ${year}`);
            }

            if (sub === 'airlines') {
                let airlineNames = [];
                try {
                    const airlinesRes = await axios.get(`${API}/airlines`);
                    airlineNames = airlinesRes.data.map(a => a.airline ?? a.name ?? a).filter(Boolean);
                } catch {
                    try {
                        const sample = await axios.get(`${API}/flights`, { params: { limit: 1000 } });
                        airlineNames = [...new Set(sample.data.map(f => f.airline?.split(' (')[0]).filter(Boolean))];
                    } catch { /* no dropdown */ }
                }

                if (!airlineNames.length) {
                    return interaction.editReply({ content: 'Could not load airlines list.', components: [] });
                }

                const selectMsg = await interaction.editReply({
                    content: 'Select an airline:',
                    components: [new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('airline_select')
                            .setPlaceholder('Select an airline…')
                            .addOptions(airlineNames.slice(0, 25).map(name => ({ label: name, value: name })))
                    )],
                });

                let selectedAirline;
                try {
                    const selection = await selectMsg.awaitMessageComponent({
                        filter: i => i.user.id === interaction.user.id,
                        componentType: ComponentType.StringSelect,
                        time: 30_000,
                    });
                    selectedAirline = selection.values[0];
                    await selection.deferUpdate();
                } catch {
                    return interaction.editReply({ content: 'Timed out — no airline selected.', components: [] });
                }

                const res = await axios.get(`${API}/flights`, { params: { limit: 1000, airline: selectedAirline } });
                const flights = res.data;
                if (!flights.length) return interaction.editReply({ content: `No flights found for ${selectedAirline}.`, components: [] });
                return paginate(interaction, flights.map(formatLine), `✈️ Flights — ${selectedAirline}`);
            }

            if (sub === 'registration') {
                let registrations = [];
                try {
                    const regsRes = await axios.get(`${API}/registrations`);
                    registrations = regsRes.data.map(r => ({
                        reg: (r.registration ?? r.reg ?? r).toString().toUpperCase(),
                        label: r.aircraft ?? r.model ?? null,
                    }));
                } catch {
                    try {
                        const sample = await axios.get(`${API}/flights`, { params: { limit: 1000 } });
                        const seen = new Set();
                        registrations = sample.data
                            .filter(f => f.registration && !seen.has(f.registration) && seen.add(f.registration))
                            .map(f => ({ reg: f.registration.toUpperCase(), label: f.aircraft ?? null }));
                    } catch { /* no dropdown */ }
                }

                if (!registrations.length) {
                    return interaction.editReply({ content: 'Could not load registrations list.', components: [] });
                }

                const selectMsg = await interaction.editReply({
                    content: 'Select an aircraft registration:',
                    components: [new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('reg_select')
                            .setPlaceholder('Select a registration…')
                            .addOptions(registrations.slice(0, 25).map(r => ({
                                label: r.label ? `${r.reg} — ${r.label}` : r.reg,
                                value: r.reg,
                            })))
                    )],
                });

                let reg;
                try {
                    const selection = await selectMsg.awaitMessageComponent({
                        filter: i => i.user.id === interaction.user.id,
                        componentType: ComponentType.StringSelect,
                        time: 30_000,
                    });
                    reg = selection.values[0];
                    await selection.deferUpdate();
                } catch {
                    return interaction.editReply({ content: 'Timed out — no registration selected.', components: [] });
                }

                const res = await axios.get(`${API}/registrations/${reg}`);
                const { meta, flights } = res.data;

                if (!meta && !flights.length) {
                    return interaction.editReply({ content: `No data found for registration **${reg}**.`, components: [] });
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
                    fields.push({ name: '🕐 Last Flown', value: `${latest.date} · ${latest.flight_number ?? '—'} · ${route}`, inline: false });
                }

                const embed = new EmbedBuilder().setTitle(`🔍 Registration: ${reg}`).setColor(0x00aaff).addFields(...fields);
                if (meta?.photo_thumbnail_url) embed.setThumbnail(meta.photo_thumbnail_url);

                return interaction.editReply({ embeds: [embed], components: [] });
            }

        } catch (err) {
            console.error('diary command error:', err?.response?.data || err.message);
            return interaction.editReply('Failed to fetch flight diary data. The API may be waking up — try again in a moment.');
        }
    },
};
