const { SlashCommandBuilder } = require('@discordjs/builders');

function toMemegenPart(text) {
    return encodeURIComponent(text.trim().replace(/\s+/g, '_'));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('boi')
        .setDescription('Generate a custom memegen image: top | bottom')
        .addStringOption(opt => opt.setName('top').setDescription('Top text').setRequired(true))
        .addStringOption(opt => opt.setName('bottom').setDescription('Bottom text').setRequired(true)),
    async execute(interaction) {
        const top = interaction.options.getString('top');
        const bottom = interaction.options.getString('bottom');
        const topPart = toMemegenPart(top);
        const bottomPart = toMemegenPart(bottom);
        const alt = encodeURIComponent('https://i.imgur.com/sDiLVhl.png');
        const url = `https://api.memegen.link/images/custom/${topPart}/${bottomPart}.png?background=${alt}`;
        await interaction.reply(url);
    },
};
