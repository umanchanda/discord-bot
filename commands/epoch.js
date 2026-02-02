const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('epoch')
        .setDescription('Replies with current epoch time (seconds)'),
    async execute(interaction) {
        const now = Math.floor(Date.now() / 1000);
        await interaction.reply(now.toString());
    },
};
