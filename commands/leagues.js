const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// globalfootballrankings.com reads its rankings from Supabase using this public (anon) key from its frontend
const SUPABASE_URL = 'https://ifluudzbwomhiveydmbb.supabase.co/rest/v1/men_league_rankings';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmbHV1ZHpid29taGl2ZXlkbWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNjY2MDIsImV4cCI6MjA2NDg0MjYwMn0.iJLU5LH__iBdTvjkVr8mxyyA8sDh8WpoPtzrGwoHjvA';
const LEAGUE_LIMIT = 100;
const PAGE_SIZE = 20;

async function fetchLeagues() {
    const { data } = await axios.get(SUPABASE_URL, {
        params: { select: 'rank,league_name,country,rating', order: 'rank.asc', limit: LEAGUE_LIMIT },
        headers: { apikey: SUPABASE_ANON_KEY },
    });
    return data;
}

function chunkArray(items, size) {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

function formatLeague(league) {
    const rating = typeof league.rating === 'number' ? league.rating.toFixed(2) : 'N/A';
    return `**${league.rank}.** ${league.league_name} (${league.country}) — ${rating}`;
}

function buildEmbed(leagues, page, totalPages) {
    return new EmbedBuilder()
        .setTitle('⚽ Top 100 Men\'s Football Leagues')
        .setURL('https://globalfootballrankings.com/rankings/leagues/men')
        .setDescription(leagues.map(formatLeague).join('\n'))
        .setColor(0x1a7f37)
        .setFooter({ text: `Page ${page + 1}/${totalPages} · Ratings from Global Football Rankings` });
}

function buildControls(page, totalPages, disabled = false) {
    const previousButton = new ButtonBuilder()
        .setCustomId('leagues_previous')
        .setLabel('Previous')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || page === 0);

    const nextButton = new ButtonBuilder()
        .setCustomId('leagues_next')
        .setLabel('Next')
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || page >= totalPages - 1);

    return new ActionRowBuilder().addComponents(previousButton, nextButton);
}

function buildMessage(pages, page, disabled = false) {
    return {
        embeds: [buildEmbed(pages[page], page, pages.length)],
        components: [buildControls(page, pages.length, disabled)],
    };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leagues')
        .setDescription('Show the top 100 men\'s football leagues from Global Football Rankings'),
    async execute(interaction) {
        await interaction.deferReply();

        let leagues;
        try {
            leagues = await fetchLeagues();
        } catch (err) {
            console.error('leagues fetch error:', err);
            return interaction.editReply('Failed to fetch league rankings right now.');
        }

        if (!Array.isArray(leagues) || leagues.length === 0) {
            return interaction.editReply('No league rankings were found.');
        }

        const pages = chunkArray(leagues, PAGE_SIZE);
        let page = 0;

        await interaction.editReply(buildMessage(pages, page));

        const reply = await interaction.fetchReply();
        const collector = reply.createMessageComponentCollector({
            filter: componentInteraction => componentInteraction.user.id === interaction.user.id,
            time: 5 * 60 * 1000,
        });

        collector.on('collect', async componentInteraction => {
            if (componentInteraction.customId === 'leagues_previous') {
                page = Math.max(page - 1, 0);
            } else if (componentInteraction.customId === 'leagues_next') {
                page = Math.min(page + 1, pages.length - 1);
            }

            await componentInteraction.update(buildMessage(pages, page));
        });

        collector.on('end', async () => {
            try {
                await interaction.editReply(buildMessage(pages, page, true));
            } catch (err) {
                console.error('leagues collector cleanup error:', err);
            }
        });
    },
};
