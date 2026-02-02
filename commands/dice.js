const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Roll a dice. Default is 6-sided, or provide number of sides (1-50)')
        .addIntegerOption(opt =>
            opt.setName('sides')
                .setDescription('Number of sides (1-50)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(50)
        ),
    async execute(interaction) {
        const sides = interaction.options.getInteger('sides') ?? 6;
        const roll = Math.floor(Math.random() * sides) + 1;
        await interaction.reply(`${roll}`);
    },
};
