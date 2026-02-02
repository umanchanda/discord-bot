const { SlashCommandBuilder } = require('@discordjs/builders');

function toMemegenPart(text) {
    return encodeURIComponent(text.trim().replace(/\s+/g, '_'));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('headout')
        .setDescription('Generate headout meme image (top, bottom)')
        .addStringOption(opt => opt.setName('top').setDescription('Top text').setRequired(false))
        .addStringOption(opt => opt.setName('bottom').setDescription('Bottom text').setRequired(false)),
    async execute(interaction) {
        const top = interaction.options.getString('top');
        const bottom = interaction.options.getString('bottom');
        const topPart = toMemegenPart(top);
        const bottomPart = toMemegenPart(bottom);
        const alt = encodeURIComponent('https://i.imgur.com/hKXFrCo.jpeg');
        const url = `https://api.memegen.link/images/custom/${topPart}/${bottomPart}.jpg?background=${alt}`;
        await interaction.reply(url);
    },
};
