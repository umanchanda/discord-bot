const { SlashCommandBuilder } = require('@discordjs/builders');

function toMemegenPart(text) {
    return encodeURIComponent(text.trim().replace(/\s+/g, '_'));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mock')
        .setDescription('Generate spongebob mock meme (top, bottom)')
        .addStringOption(opt => opt.setName('top').setDescription('Top text').setRequired(true))
        .addStringOption(opt => opt.setName('bottom').setDescription('Bottom text').setRequired(true)),
    async execute(interaction) {
        const top = interaction.options.getString('top');
        const bottom = interaction.options.getString('bottom');
        const topPart = toMemegenPart(top);
        const bottomPart = toMemegenPart(bottom);
        const url = `https://api.memegen.link/images/spongebob/${topPart}/${bottomPart}.jpg?watermark=MemeComplete.com&token=c6h4vkaiv4e96vp88quo`;
        await interaction.reply(url);
    },
};
