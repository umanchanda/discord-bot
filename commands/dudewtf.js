const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder().setName('dudewtf').setDescription('dude wtf'),
    async execute(interaction) {
        await interaction.reply('https://youtu.be/MmzJ-deqBtg?si=7XDHN8KT_14ReguP');
    },
};
