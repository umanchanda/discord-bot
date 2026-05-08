const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

const LEAGUES = {
    'premier_league': { id: 39,  name: 'Premier League',  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    'la_liga':        { id: 140, name: 'La Liga',          flag: '🇪🇸' },
    'bundesliga':     { id: 78,  name: 'Bundesliga',       flag: '🇩🇪' },
    'ligue_1':        { id: 61,  name: 'Ligue 1',          flag: '🇫🇷' },
    'mls':            { id: 253, name: 'MLS',              flag: '🇺🇸' },
};

const STATUS_LABELS = {
    'NS':  'Not Started',
    '1H':  '1st Half',
    'HT':  'Half Time',
    '2H':  '2nd Half',
    'ET':  'Extra Time',
    'P':   'Penalties',
    'FT':  'Full Time',
    'AET': 'After Extra Time',
    'PEN': 'After Penalties',
    'PST': 'Postponed',
    'CANC':'Cancelled',
    'ABD': 'Abandoned',
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
        const apiKey = process.env.APISPORTS_KEY;
        if (!apiKey) {
            return interaction.reply({ content: 'API-Sports key not configured. Set APISPORTS_KEY in .env', ephemeral: true });
        }

        const leagueKey = interaction.options.getString('league');
        const league = LEAGUES[leagueKey];
        const today = new Date().toISOString().split('T')[0];
        const season = new Date().getFullYear();

        await interaction.deferReply();

        try {
            const res = await fetch(
                `https://v3.football.api-sports.io/fixtures?league=${league.id}&season=${season}&date=${today}`,
                {
                    headers: {
                        'x-apisports-key': apiKey,
                    },
                }
            );

            if (!res.ok) {
                const txt = await res.text();
                return interaction.editReply(`API error: ${res.status} — ${txt}`);
            }

            const body = await res.json();
            const fixtures = body.response;

            if (!fixtures || fixtures.length === 0) {
                return interaction.editReply(`No matches found for **${league.name}** today (${today}).`);
            }

            const lines = fixtures.map(f => {
                const home = f.teams.home.name;
                const away = f.teams.away.name;
                const status = f.fixture.status.short;
                const elapsed = f.fixture.status.elapsed;
                const homeGoals = f.goals.home ?? '-';
                const awayGoals = f.goals.away ?? '-';
                const label = STATUS_LABELS[status] || status;

                let statusStr;
                if (status === 'NS') {
                    const kickoff = new Date(f.fixture.date);
                    statusStr = `KO ${kickoff.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}`;
                } else if (['1H', '2H', 'ET'].includes(status)) {
                    statusStr = `${elapsed}'`;
                } else {
                    statusStr = label;
                }

                return `**${home}** ${homeGoals} - ${awayGoals} **${away}** *(${statusStr})*`;
            });

            const embed = new EmbedBuilder()
                .setTitle(`${league.flag} ${league.name} — ${today}`)
                .setDescription(lines.join('\n'))
                .setColor(0x00b4d8)
                .setFooter({ text: 'Powered by API-Football' });

            return interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error('Soccer command error:', err);
            try { await interaction.editReply('Failed to fetch soccer scores.'); } catch (e) {}
        }
    },
};
