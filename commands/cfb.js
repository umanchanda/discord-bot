const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

const RANKINGS_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings';

const formatTrend = (trend) => {
    if (!trend || trend === '-') return '';
    return trend.startsWith('+') ? ` ▲${trend.slice(1)}` : ` ▼${trend.replace('-', '')}`;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cfb')
        .setDescription('Get the current AP Top 25 college football rankings'),
    async execute(interaction) {
        await interaction.deferReply();

        let poll;
        try {
            const { data } = await axios.get(RANKINGS_URL);
            poll = data.rankings?.find(r => r.type === 'ap');
        } catch (err) {
            console.error('CFB rankings fetch error:', err);
            return interaction.editReply('Failed to fetch AP Top 25 rankings.');
        }

        if (!poll || !poll.ranks?.length) {
            return interaction.editReply('AP Top 25 rankings are not available right now.');
        }

        const lines = poll.ranks.map(r => {
            const firstPlace = r.firstPlaceVotes ? ` (${r.firstPlaceVotes})` : '';
            return `**${r.current}.** ${r.team.location}${firstPlace} — ${r.recordSummary || 'N/A'}${formatTrend(r.trend)}`;
        });

        const embed = new EmbedBuilder()
            .setTitle('🏈 AP Top 25')
            .setDescription(lines.join('\n'))
            .setColor(0x013369)
            .setFooter({ text: [poll.occurrence?.displayValue, 'First-place votes in parentheses'].filter(Boolean).join(' · ') });

        await interaction.editReply({ embeds: [embed] });
    },
};
