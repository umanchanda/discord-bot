const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const axios = require('axios');

function decodeHtml(str) {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&ldquo;/g, '"')
        .replace(/&rdquo;/g, '"')
        .replace(/&rsquo;/g, "'");
}

function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Answer a random sports trivia question'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const res = await axios.get('https://opentdb.com/api.php?amount=1&category=21&type=multiple');
            const q = res.data.results[0];
            if (!q) return interaction.editReply('Could not fetch a trivia question. Try again!');

            const question = decodeHtml(q.question);
            const correct = decodeHtml(q.correct_answer);
            const answers = shuffle([correct, ...q.incorrect_answers.map(decodeHtml)]);
            const labels = ['A', 'B', 'C', 'D'];

            const row = new ActionRowBuilder().addComponents(
                answers.map((ans, i) =>
                    new ButtonBuilder()
                        .setCustomId(`trivia_${i}`)
                        .setLabel(`${labels[i]}: ${ans}`)
                        .setStyle(ButtonStyle.Primary)
                )
            );

            const response = await interaction.editReply({
                content: `**Sports Trivia** *(${q.difficulty})*\n\n${question}`,
                components: [row],
            });

            try {
                const btn = await response.awaitMessageComponent({
                    filter: i => i.user.id === interaction.user.id,
                    componentType: ComponentType.Button,
                    time: 30_000,
                });

                const chosenIdx = parseInt(btn.customId.split('_')[1]);
                const chosen = answers[chosenIdx];
                const isCorrect = chosen === correct;

                const disabledRow = new ActionRowBuilder().addComponents(
                    answers.map((ans, i) =>
                        new ButtonBuilder()
                            .setCustomId(`trivia_${i}`)
                            .setLabel(`${labels[i]}: ${ans}`)
                            .setStyle(ans === correct ? ButtonStyle.Success : i === chosenIdx ? ButtonStyle.Danger : ButtonStyle.Secondary)
                            .setDisabled(true)
                    )
                );

                await btn.update({
                    content: `**Sports Trivia** *(${q.difficulty})*\n\n${question}\n\n${isCorrect ? '✅ Correct!' : `❌ Wrong! The correct answer was **${correct}**`}`,
                    components: [disabledRow],
                });
            } catch {
                const disabledRow = new ActionRowBuilder().addComponents(
                    answers.map((ans, i) =>
                        new ButtonBuilder()
                            .setCustomId(`trivia_${i}`)
                            .setLabel(`${labels[i]}: ${ans}`)
                            .setStyle(ans === correct ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(true)
                    )
                );
                await interaction.editReply({
                    content: `**Sports Trivia** *(${q.difficulty})*\n\n${question}\n\n⏱️ Time's up! The correct answer was **${correct}**`,
                    components: [disabledRow],
                });
            }
        } catch (err) {
            console.error('Trivia command error:', err);
            try { await interaction.editReply('Failed to fetch trivia question.'); } catch (e) {}
        }
    },
};
