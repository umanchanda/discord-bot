const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('insult')
        .setDescription('Get a random insult'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const res = await fetch('https://insult.mattbas.org/api/insult.txt');
            if (!res.ok) return interaction.editReply('Insult API error');
            const text = await res.text();
            await interaction.editReply(text);
        } catch (err) {
            console.error('Insult command error:', err);
            try { await interaction.editReply('Failed to fetch insult.'); } catch (e) {}
        }
    },
};
