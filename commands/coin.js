const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder().setName('coin').setDescription('Flip a coin'),
    async execute(interaction) {
        const choices = ['heads', 'tails'];
        const pick = choices[Math.floor(Math.random() * choices.length)];
        await interaction.reply(pick);
    }
};
