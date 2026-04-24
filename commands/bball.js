const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bball')
        .setDescription('Get NBA scores for a specific date')
        .addIntegerOption(option =>
            option.setName('year').setDescription('Year (e.g. 2024)').setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('month').setDescription('Month (1-12)').setRequired(true).setMinValue(1).setMaxValue(12)
        )
        .addIntegerOption(option =>
            option.setName('day').setDescription('Day (1-31)').setRequired(true).setMinValue(1).setMaxValue(31)
        ),
    async execute(interaction) {
        const year = interaction.options.getInteger('year');
        const month = interaction.options.getInteger('month');
        const day = interaction.options.getInteger('day');
        const url = `https://uman230-nba-api-2a9531748263.herokuapp.com/scores/${year}/${month}/${day}`;
        await interaction.reply(url);
    }
};
