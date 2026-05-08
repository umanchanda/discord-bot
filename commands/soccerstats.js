const { SlashCommandBuilder } = require('@discordjs/builders');
const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');

const LEAGUES = {
    'premier_league': { slug: 'eng.1', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    'la_liga':        { slug: 'esp.1', name: 'La Liga',         flag: '🇪🇸' },
    'bundesliga':     { slug: 'ger.1', name: 'Bundesliga',      flag: '🇩🇪' },
    'ligue_1':        { slug: 'fra.1', name: 'Ligue 1',         flag: '🇫🇷' },
    'mls':            { slug: 'usa.1', name: 'MLS',             flag: '🇺🇸' },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('soccerstats')
        .setDescription('Get detailed stats for a soccer match')
        .addStringOption(opt =>
            opt.setName('league')
                .setDescription('Which league?')
                .setRequired(true)
                .addChoices(
                    { name: 'Premier League', value: 'premier_league' },
                    { name: 'La Liga',        value: 'la_liga' },
                    { name: 'Bundesliga',     value: 'bundesliga' },
                    { name: 'Ligue 1',        value: 'ligue_1' },
                    { name: 'MLS',            value: 'mls' },
                )
        )
        .addIntegerOption(opt =>
            opt.setName('year').setDescription('Year (e.g. 2025)').setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName('month').setDescription('Month (1-12)').setRequired(true).setMinValue(1).setMaxValue(12)
        )
        .addIntegerOption(opt =>
            opt.setName('day').setDescription('Day (1-31)').setRequired(true).setMinValue(1).setMaxValue(31)
        ),

    async execute(interaction) {
        const leagueKey   = interaction.options.getString('league');
        const year        = interaction.options.getInteger('year');
        const month       = interaction.options.getInteger('month');
        const day         = interaction.options.getInteger('day');
        const league      = LEAGUES[leagueKey];
        const dateStr     = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
        const displayDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        await interaction.deferReply();

        // Step 1: fetch scoreboard to get event list
        let events;
        try {
            const res = await fetch(
                `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/scoreboard?dates=${dateStr}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const body = await res.json();
            events = body.events || [];
        } catch (err) {
            console.error('ESPN scoreboard fetch error:', err);
            return interaction.editReply('Failed to fetch matches from ESPN.');
        }

        if (events.length === 0) {
            return interaction.editReply(`No **${league.name}** matches found on **${displayDate}**.`);
        }

        const options = events.slice(0, 25).map(e => {
            const comp = e.competitions[0];
            const home = comp.competitors.find(c => c.homeAway === 'home');
            const away = comp.competitors.find(c => c.homeAway === 'away');
            const detail = comp.status.type.shortDetail;
            return {
                label: `${home.team.displayName} vs ${away.team.displayName}`.slice(0, 100),
                description: detail,
                value: e.id,
            };
        });

        const select = new StringSelectMenuBuilder()
            .setCustomId('soccerstats_match_select')
            .setPlaceholder('Select a match')
            .addOptions(options);

        await interaction.editReply({
            content: `**${league.flag} ${league.name} — ${displayDate}** · Select a match:`,
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
            return interaction.editReply({ content: 'Timed out — run `/soccerstats` again.', components: [] });
        }

        await picked.deferUpdate();

        const eventId = picked.values[0];

        // Step 2: fetch match summary
        let summary;
        try {
            const res = await fetch(
                `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/summary?event=${eventId}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            summary = await res.json();
        } catch (err) {
            console.error('ESPN summary fetch error:', err);
            return interaction.editReply({ content: 'Failed to fetch match details.', components: [] });
        }

        const comp        = summary.header?.competitions?.[0] ?? {};
        const homeComp    = comp.competitors?.find(c => c.homeAway === 'home') ?? {};
        const awayComp    = comp.competitors?.find(c => c.homeAway === 'away') ?? {};
        const homeTeam    = homeComp.team?.displayName ?? 'Home';
        const awayTeam    = awayComp.team?.displayName ?? 'Away';
        const homeScore   = homeComp.score ?? '-';
        const awayScore   = awayComp.score ?? '-';
        const matchStatus = comp.status?.type?.description ?? '';

        // Stats — ESPN returns per-team arrays under boxscore.teams
        const boxTeams = summary.boxscore?.teams ?? [];
        const homeBT   = boxTeams.find(t => t.homeAway === 'home') ?? {};
        const awayBT   = boxTeams.find(t => t.homeAway === 'away') ?? {};

        const getStat = (teamStats, ...names) => {
            for (const name of names) {
                const s = (teamStats.statistics ?? []).find(
                    s => s.name === name || s.label?.toLowerCase().includes(name.toLowerCase())
                );
                if (s) return s.displayValue;
            }
            return null;
        };

        const statRow = (label, homeStat, awayStat) => {
            if (!homeStat && !awayStat) return null;
            return `**${label}:** ${homeStat ?? '-'} – ${awayStat ?? '-'}`;
        };

        const statsLines = [
            statRow('Possession',      getStat(homeBT, 'possessionPct', 'Possession'),        getStat(awayBT, 'possessionPct', 'Possession')),
            statRow('Shots',           getStat(homeBT, 'totalShots', 'Shots'),                getStat(awayBT, 'totalShots', 'Shots')),
            statRow('Shots on Target', getStat(homeBT, 'shotsOnTarget', 'Shots on Target'),   getStat(awayBT, 'shotsOnTarget', 'Shots on Target')),
            statRow('Corners',         getStat(homeBT, 'corners', 'Corner Kicks'),            getStat(awayBT, 'corners', 'Corner Kicks')),
            statRow('Fouls',           getStat(homeBT, 'foulsCommitted', 'Fouls'),            getStat(awayBT, 'foulsCommitted', 'Fouls')),
            statRow('Yellow Cards',    getStat(homeBT, 'yellowCards', 'Yellow Cards'),        getStat(awayBT, 'yellowCards', 'Yellow Cards')),
            statRow('Red Cards',       getStat(homeBT, 'redCards', 'Red Cards'),              getStat(awayBT, 'redCards', 'Red Cards')),
        ].filter(Boolean);

        // Scoring plays
        const goalLines = (summary.scoringPlays ?? []).map(sp => {
            const time = sp.clock?.displayValue ? `${sp.clock.displayValue}'` : '';
            const team = sp.team?.displayName ?? '';
            const text = sp.text ?? '';
            return `${time} **${team}** — ${text}`.trim();
        });

        // Venue
        const venue      = summary.gameInfo?.venue ?? summary.venue ?? null;
        const venueName  = venue?.fullName ?? null;
        const attendance = summary.gameInfo?.attendance ?? null;

        const embed = new EmbedBuilder()
            .setTitle(`${league.flag} ${league.name} — ${homeTeam} vs ${awayTeam}`)
            .setDescription(`**${homeScore} – ${awayScore}** · ${matchStatus}`)
            .setColor(0x00b4d8);

        if (statsLines.length > 0) {
            embed.addFields({ name: `📊 Stats (${homeTeam} – ${awayTeam})`, value: statsLines.join('\n') });
        }

        if (goalLines.length > 0) {
            embed.addFields({ name: '⚽ Goals', value: goalLines.join('\n') });
        }

        const footerParts = [];
        if (venueName)  footerParts.push(`📍 ${venueName}`);
        if (attendance) footerParts.push(`👥 ${Number(attendance).toLocaleString()}`);
        embed.setFooter({ text: footerParts.length ? footerParts.join(' · ') : 'Powered by ESPN' });

        await interaction.editReply({ embeds: [embed], components: [] });
    },
};
