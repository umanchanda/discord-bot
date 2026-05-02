const { SlashCommandBuilder } = require('@discordjs/builders');
const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const BASE = 'https://api.jolpi.ca/ergast/f1';

async function fetchRaces(year) {
    const { data } = await axios.get(`${BASE}/${year}/races.json?limit=30`);
    return data.MRData.RaceTable.Races;
}

async function fetchResults(year, round) {
    const { data } = await axios.get(`${BASE}/${year}/${round}/results.json`);
    return data.MRData.RaceTable.Races[0];
}

async function fetchQualifying(year, round) {
    const { data } = await axios.get(`${BASE}/${year}/${round}/qualifying.json`);
    return data.MRData.RaceTable.Races[0];
}

const driverName = (d) => `${d.givenName} ${d.familyName}`;
const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('f1')
        .setDescription('Look up F1 race results by season')
        .addIntegerOption(opt =>
            opt.setName('year')
                .setDescription('Season year (e.g. 2024)')
                .setRequired(true)
                .setMinValue(1950)
                .setMaxValue(new Date().getFullYear())
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const year = interaction.options.getInteger('year');

        let races;
        try {
            races = await fetchRaces(year);
        } catch (err) {
            console.error('F1 races fetch error:', err);
            return interaction.editReply(`Failed to fetch races for ${year}.`);
        }

        if (!races || races.length === 0) {
            return interaction.editReply(`No races found for the ${year} season.`);
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('f1_race_select')
            .setPlaceholder('Select a race')
            .addOptions(races.map(race => ({
                label: race.raceName,
                description: `Round ${race.round} — ${race.date}`,
                value: race.round,
            })));

        await interaction.editReply({
            content: `**${year} F1 Season** — Select a race:`,
            components: [new ActionRowBuilder().addComponents(select)],
        });

        const reply = await interaction.fetchReply();
        let picked;
        try {
            picked = await reply.awaitMessageComponent({
                filter: i => i.user.id === interaction.user.id,
                time: 60_000,
            });
        } catch {
            return interaction.editReply({ content: 'Timed out — run `/f1` again.', components: [] });
        }

        await picked.deferUpdate();

        const round = picked.values[0];
        const raceInfo = races.find(r => r.round === round);

        let results, qualifying;
        try {
            [results, qualifying] = await Promise.all([
                fetchResults(year, round),
                fetchQualifying(year, round).catch(() => null),
            ]);
        } catch (err) {
            console.error('F1 results fetch error:', err);
            return interaction.editReply({ content: 'Failed to fetch race data.', components: [] });
        }

        if (!results || !results.Results?.length) {
            return interaction.editReply({ content: `No results available yet for that race.`, components: [] });
        }

        const top10 = results.Results.slice(0, 10);
        const fastestLap = results.Results.find(r => r.FastestLap?.rank === '1');
        const pole = qualifying?.QualifyingResults?.[0];

        const podiumStr = top10.slice(0, 3).map((r, i) =>
            `${MEDALS[i]} ${driverName(r.Driver)} (${r.Constructor.name})`
        ).join('\n');

        const top10Str = top10.map(r =>
            `**${r.position}.** ${driverName(r.Driver)} (${r.Constructor.name})`
        ).join('\n');

        const fastestLapStr = fastestLap
            ? `${driverName(fastestLap.Driver)} — ${fastestLap.FastestLap.Time.time} (Lap ${fastestLap.FastestLap.lap})`
            : 'N/A';

        const poleStr = pole
            ? `${driverName(pole.Driver)} — ${pole.Q3 || pole.Q2 || pole.Q1 || 'N/A'}`
            : 'N/A';

        const embed = new EmbedBuilder()
            .setTitle(`🏎️ ${results.raceName} ${year}`)
            .setDescription(`📍 ${results.Circuit.circuitName}, ${results.Circuit.Location.country} — ${results.date}`)
            .addFields(
                { name: '🏆 Podium', value: podiumStr },
                { name: '📋 Top 10', value: top10Str },
                { name: '⚡ Fastest Lap', value: fastestLapStr, inline: true },
                { name: '🏁 Pole Position', value: poleStr, inline: true },
            )
            .setColor(0xe10600)
            .setFooter({ text: `Round ${results.round} · ${year} F1 World Championship` });

        await interaction.editReply({ embeds: [embed], components: [] });
    },
};
