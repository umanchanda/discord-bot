const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const API_URL = 'https://movie-db-ekse.onrender.com/api/movies';
const PAGE_SIZE = 40;

function chunkArray(items, size) {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

function formatMovie(movie, index) {
    const year = movie.year ? ` (${movie.year})` : '';
    return `**${index}.** ${movie.name}${year}`;
}

function buildEmbed(movies, page, totalPages, totalMovies) {
    const startIndex = page * PAGE_SIZE;
    const lines = movies.map((movie, offset) => formatMovie(movie, startIndex + offset + 1));

    return new EmbedBuilder()
        .setTitle('🎬 Movies Watched')
        .setDescription(lines.join('\n'))
        .setColor(0xE50914)
        .setFooter({ text: `Page ${page + 1}/${totalPages} · ${totalMovies} total movies` });
}

function buildControls(page, totalPages) {
    const previousButton = new ButtonBuilder()
        .setCustomId('movies_previous')
        .setLabel('Previous')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0);

    const nextButton = new ButtonBuilder()
        .setCustomId('movies_next')
        .setLabel('Next')
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages - 1);

    return new ActionRowBuilder().addComponents(previousButton, nextButton);
}

function buildDisabledControls(page, totalPages) {
    const previousButton = new ButtonBuilder()
        .setCustomId('movies_previous')
        .setLabel('Previous')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

    const nextButton = new ButtonBuilder()
        .setCustomId('movies_next')
        .setLabel('Next')
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

    return new ActionRowBuilder().addComponents(previousButton, nextButton);
}

function buildMessage(pages, page, totalMovies) {
    return {
        embeds: [buildEmbed(pages[page], page, pages.length, totalMovies)],
        components: [buildControls(page, pages.length)],
    };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('movies')
        .setDescription('Show all movies you have watched'),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const { data } = await axios.get(API_URL);

            if (!Array.isArray(data) || data.length === 0) {
                return interaction.editReply('No watched movies were found.');
            }

            const pages = chunkArray(data, PAGE_SIZE);

            await interaction.editReply(buildMessage(pages, 0, data.length));

            const reply = await interaction.fetchReply();
            let page = 0;
            const collector = reply.createMessageComponentCollector({
                filter: componentInteraction => componentInteraction.user.id === interaction.user.id,
                time: 5 * 60 * 1000,
            });

            collector.on('collect', async componentInteraction => {
                if (componentInteraction.customId === 'movies_previous') {
                    page = Math.max(page - 1, 0);
                } else if (componentInteraction.customId === 'movies_next') {
                    page = Math.min(page + 1, pages.length - 1);
                }

                await componentInteraction.update(buildMessage(pages, page, data.length));
            });

            collector.on('end', async () => {
                if (!interaction.channel) return;
                try {
                    await interaction.editReply({
                        embeds: [buildEmbed(pages[page], page, pages.length, data.length)],
                        components: [buildDisabledControls(page, pages.length)],
                    });
                } catch (err) {
                    console.error('movies collector cleanup error:', err);
                }
            });
        } catch (err) {
            console.error('movies command error:', err);
            try {
                await interaction.editReply('Failed to fetch movies right now.');
            } catch (replyErr) {
                console.error('movies command reply error:', replyErr);
            }
        }
    },
};