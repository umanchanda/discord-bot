const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

const LEAGUES = {
    'premier_league': { slug: 'eng.1', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    'la_liga':        { slug: 'esp.1', name: 'La Liga',         flag: '🇪🇸' },
    'bundesliga':     { slug: 'ger.1', name: 'Bundesliga',      flag: '🇩🇪' },
    'ligue_1':        { slug: 'fra.1', name: 'Ligue 1',         flag: '🇫🇷' },
    'mls':            { slug: 'usa.1', name: 'MLS',             flag: '🇺🇸' },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('soccer')
        .setDescription("Get today's soccer scores for a league")
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
        ),

    async execute(interaction) {
        const leagueKey = interaction.options.getString('league');
        const league = LEAGUES[leagueKey];

        await interaction.deferReply();

        try {
            const res = await fetch(
                `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/scoreboard`
            );

            if (!res.ok) {
                return interaction.editReply(`ESPN API error: ${res.status}`);
            }

            const body = await res.json();
            const events = body.events;

            if (!events || events.length === 0) {
                return interaction.editReply(`No matches found for **${league.name}** today.`);
            }

            const lines = events.map(event => {
                const competition = event.competitions[0];
                const home = competition.competitors.find(c => c.homeAway === 'home');
                const away = competition.competitors.find(c => c.homeAway === 'away');
                const status = competition.status.type.name;
                const detail = competition.status.type.shortDetail;
                const clock = competition.status.displayClock;

                const homeName = home.team.displayName;
                const awayName = away.team.displayName;
                const homeScore = home.score ?? '-';
                const awayScore = away.score ?? '-';

                let statusStr;
                if (status === 'STATUS_SCHEDULED') {
                    statusStr = detail;
                } else if (status === 'STATUS_IN_PROGRESS') {
                    statusStr = clock;
                } else if (status === 'STATUS_HALFTIME') {
                    statusStr = 'HT';
                } else {
                    statusStr = detail;
                }

                return `**${homeName}** ${homeScore} - ${awayScore} **${awayName}** *(${statusStr})*`;
            });

            const embed = new EmbedBuilder()
                .setTitle(`${league.flag} ${league.name}`)
                .setDescription(lines.join('\n'))
                .setColor(0x00b4d8)
                .setFooter({ text: 'Powered by ESPN' });

            return interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error('Soccer command error:', err);
            try { await interaction.editReply('Failed to fetch soccer scores.'); } catch (e) {}
        }
    },
};
