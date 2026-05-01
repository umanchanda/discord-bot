const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');

// RT uses Algolia for search; these are the public read-only search credentials
// embedded in the RT website frontend. Update if they ever change.
const ALGOLIA_APP_ID = '79FRDP12PN';
const ALGOLIA_API_KEY = '175588f6e5f8319b27702e4cc4013561';
const ALGOLIA_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/*/queries`;

async function fetchTomatoScore(movieTitle) {
    const { data } = await axios.post(
        ALGOLIA_URL,
        {
            requests: [{
                indexName: 'content_rt',
                params: `query=${encodeURIComponent(movieTitle)}&hitsPerPage=5&filters=type%3Amovie`,
            }],
        },
        {
            headers: {
                'X-Algolia-Application-Id': ALGOLIA_APP_ID,
                'X-Algolia-API-Key': ALGOLIA_API_KEY,
            },
            timeout: 8000,
        }
    );

    const hit = data?.results?.[0]?.hits?.[0];
    if (!hit) return null;

    return {
        title: hit.title,
        year: hit.releaseYear,
        criticsScore: hit.rottenTomatoes?.criticsScore ?? null,
        audienceScore: hit.rottenTomatoes?.audienceScore ?? null,
        certifiedFresh: hit.rottenTomatoes?.certifiedFresh ?? false,
        url: hit.vanity ? `https://www.rottentomatoes.com/m/${hit.vanity}` : null,
    };
}

function tomatoEmoji(certifiedFresh, score) {
    if (score == null) return '❓';
    if (certifiedFresh) return '✅';
    return score >= 60 ? '🍅' : '🤢';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tomato')
        .setDescription('Get the Rotten Tomatoes Tomatometer score for a movie')
        .addStringOption(option =>
            option
                .setName('movie')
                .setDescription('Movie title to look up')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const movieTitle = interaction.options.getString('movie');
        try {
            const result = await fetchTomatoScore(movieTitle);
            if (!result) {
                return interaction.editReply(`No results found for **${movieTitle}** on Rotten Tomatoes.`);
            }

            const { title, year, criticsScore, audienceScore, certifiedFresh, url } = result;
            const yearStr = year ? ` (${year})` : '';
            const emoji = tomatoEmoji(certifiedFresh, criticsScore);

            const criticsStr = criticsScore != null ? `**${criticsScore}%** Tomatometer` : 'No Tomatometer score';
            const audienceStr = audienceScore != null ? ` | **${audienceScore}%** Audience` : '';
            const freshLabel = certifiedFresh ? ' *(Certified Fresh)*' : '';

            const msg = `${emoji} **${title}**${yearStr}: ${criticsStr}${audienceStr}${freshLabel}`;
            return interaction.editReply(url ? `${msg}\n${url}` : msg);
        } catch (err) {
            console.error('Tomato command error:', err);
            try { await interaction.editReply('Failed to fetch Rotten Tomatoes data.'); } catch (e) {}
        }
    },
};
