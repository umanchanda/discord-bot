const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder().setName('dudewtf').setDescription('dude wtf'),
    async execute(interaction) {
        await interaction.reply('https://cdn.discordapp.com/attachments/1307965555520831530/1500267759026835647/Family_Guy_-_Who_the_fk_starts_a_conversation_like_that_i_just_sat_down.mp4?ex=69f7d0bb&is=69f67f3b&hm=4434fbb6c56fd16dbda64870373f378c9ddf1cb81d4af056b5fd80b63de708bc&');
    },
};
