const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('putin')
        .setDescription('Send the Putin link'),
    async execute(interaction) {
        await interaction.reply('https://youtu.be/noQXojwExRA');
    },
};
