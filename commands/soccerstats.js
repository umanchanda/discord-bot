const { SlashCommandBuilder } = require('@discordjs/builders');
const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');

const FOTMOB_LEAGUES = {
    47:  { name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    87:  { name: 'La Liga',        flag: '🇪🇸' },
    54:  { name: 'Bundesliga',     flag: '🇩🇪' },
    53:  { name: 'Ligue 1',        flag: '🇫🇷' },
    130: { name: 'MLS',            flag: '🇺🇸' },
};

const FOTMOB_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0)',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('soccerstats')
        .setDescription('Get detailed stats for a soccer match')
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
        const year  = interaction.options.getInteger('year');
        const month = interaction.options.getInteger('month');
        const day   = interaction.options.getInteger('day');
        const mm    = String(month).padStart(2, '0');
        const dd    = String(day).padStart(2, '0');
        const dateStr    = `${year}${mm}${dd}`;
        const displayDate = `${year}-${mm}-${dd}`;

        await interaction.deferReply();

        // Step 1: fetch matches for the date
        let matches = [];
        try {
            const res = await fetch(`https://www.fotmob.com/api/matches?date=${dateStr}`, { headers: FOTMOB_HEADERS });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const body = await res.json();

            for (const league of (body.leagues || [])) {
                const leagueMeta = FOTMOB_LEAGUES[league.id];
                if (!leagueMeta) continue;
                for (const match of (league.matches || [])) {
                    const home = match.homeTeam?.name ?? match.home?.name ?? '?';
                    const away = match.awayTeam?.name ?? match.away?.name ?? '?';
                    matches.push({ id: match.id, home, away, ...leagueMeta });
                }
            }
        } catch (err) {
            console.error('FotMob matches fetch error:', err);
            return interaction.editReply('Failed to fetch matches from FotMob.');
        }

        if (matches.length === 0) {
            return interaction.editReply(`No matches found for the selected leagues on **${displayDate}**.`);
        }

        const options = matches.slice(0, 25).map(m => ({
            label: `${m.home} vs ${m.away}`.slice(0, 100),
            description: `${m.flag} ${m.name}`,
            value: String(m.id),
        }));

        const select = new StringSelectMenuBuilder()
            .setCustomId('soccerstats_match_select')
            .setPlaceholder('Select a match')
            .addOptions(options);

        await interaction.editReply({
            content: `**Matches on ${displayDate}** — Select one:`,
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

        const matchId = picked.values[0];
        const matchMeta = matches.find(m => String(m.id) === matchId);

        // Step 2: fetch match details
        let details;
        try {
            const res = await fetch(`https://www.fotmob.com/api/matchDetails?matchId=${matchId}`, { headers: FOTMOB_HEADERS });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            details = await res.json();
        } catch (err) {
            console.error('FotMob match details fetch error:', err);
            return interaction.editReply({ content: 'Failed to fetch match details.', components: [] });
        }

        const general    = details.general    || {};
        const matchFacts = details.content?.matchFacts || {};

        const homeTeam  = general.homeTeam?.name  ?? matchMeta.home;
        const awayTeam  = general.awayTeam?.name  ?? matchMeta.away;
        const homeScore = general.homeTeam?.score ?? '-';
        const awayScore = general.awayTeam?.score ?? '-';

        // Flatten all stat entries across groups
        const allStats = (matchFacts.stats?.stats || []).flatMap(g => g.stats || []);
        const getStat = (...titles) => {
            for (const title of titles) {
                const s = allStats.find(s => s.title?.toLowerCase().includes(title.toLowerCase()));
                if (s) return { home: s.homeValue, away: s.awayValue };
            }
            return null;
        };

        const statLine = (label, stat, unit = '') => {
            if (!stat) return null;
            return `**${label}:** ${stat.home}${unit} – ${stat.away}${unit}`;
        };

        const statsLines = [
            statLine('Possession',      getStat('possession'),                '%'),
            statLine('xG',              getStat('xg', 'expected goals')),
            statLine('Shots',           getStat('total shots', 'shots')),
            statLine('Shots on Target', getStat('shots on target', 'on target')),
            statLine('Corners',         getStat('corner')),
            statLine('Fouls',           getStat('foul')),
        ].filter(Boolean);

        // Goal events
        const events = matchFacts.events?.events || [];
        const goalLines = events
            .filter(e => ['Goal', 'goal'].includes(e.type))
            .map(e => {
                const scorer = e.player?.name ?? e.playerName ?? 'Unknown';
                const assist = e.assistStr ? ` (assist: ${e.assistStr})` : '';
                const time   = e.time ? `${e.time}'` : '';
                const side   = e.isHome ? homeTeam : awayTeam;
                return `${time} **${scorer}**${assist} — ${side}`;
            });

        const infoBox    = matchFacts.infoBox   || {};
        const stadium    = infoBox.Stadium?.name ?? null;
        const attendance = infoBox.Attendance?.value ?? null;

        const embed = new EmbedBuilder()
            .setTitle(`${matchMeta.flag} ${matchMeta.name} — ${homeTeam} vs ${awayTeam}`)
            .setDescription(`**Score: ${homeScore} – ${awayScore}**`)
            .setColor(0x00b4d8);

        if (statsLines.length > 0) {
            embed.addFields({ name: '📊 Stats (Home – Away)', value: statsLines.join('\n') });
        }

        if (goalLines.length > 0) {
            embed.addFields({ name: '⚽ Goals', value: goalLines.join('\n') });
        }

        const footerParts = [];
        if (stadium)    footerParts.push(`📍 ${stadium}`);
        if (attendance) footerParts.push(`👥 ${Number(attendance).toLocaleString()}`);
        embed.setFooter({ text: footerParts.length ? footerParts.join(' · ') : 'Powered by FotMob' });

        await interaction.editReply({ embeds: [embed], components: [] });
    },
};
