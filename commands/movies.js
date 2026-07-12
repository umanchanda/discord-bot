const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
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
            const firstEmbed = buildEmbed(pages[0], 0, pages.length, data.length);

            await interaction.editReply({ embeds: [firstEmbed] });

            for (let page = 1; page < pages.length; page += 1) {
                const embed = buildEmbed(pages[page], page, pages.length, data.length);
                await interaction.followUp({ embeds: [embed] });
            }
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