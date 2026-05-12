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

function buildRow(answers, labels, disabled = false, chosenIdx = null, correct = null) {
    return new ActionRowBuilder().addComponents(
        answers.map((ans, i) => {
            let style = ButtonStyle.Primary;
            if (disabled) {
                if (ans === correct) style = ButtonStyle.Success;
                else if (i === chosenIdx) style = ButtonStyle.Danger;
                else style = ButtonStyle.Secondary;
            }
            return new ButtonBuilder()
                .setCustomId(`trivia_${i}`)
                .setLabel(`${labels[i]}: ${ans}`)
                .setStyle(style)
                .setDisabled(disabled);
        })
    );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Answer sports trivia questions')
        .addIntegerOption(opt =>
            opt.setName('questions')
                .setDescription('Number of questions (1-20)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(20)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const total = interaction.options.getInteger('questions') ?? 1;

        try {
            const res = await axios.get(`https://opentdb.com/api.php?amount=${total}&category=21&type=multiple`);
            const questions = res.data.results;
            if (!questions?.length) return interaction.editReply('Could not fetch trivia questions. Try again!');

            const labels = ['A', 'B', 'C', 'D'];
            let score = 0;

            for (let idx = 0; idx < questions.length; idx++) {
                const q = questions[idx];
                const question = decodeHtml(q.question);
                const correct = decodeHtml(q.correct_answer);
                const answers = shuffle([correct, ...q.incorrect_answers.map(decodeHtml)]);
                const header = `**Sports Trivia** *(${q.difficulty})* — Question ${idx + 1}/${questions.length} | Score: ${score}/${idx}\n\n${question}`;

                const response = await interaction.editReply({
                    content: header,
                    components: [buildRow(answers, labels)],
                });

                try {
                    const btn = await response.awaitMessageComponent({
                        filter: i => i.user.id === interaction.user.id,
                        componentType: ComponentType.Button,
                        time: 30_000,
                    });

                    const chosenIdx = parseInt(btn.customId.split('_')[1]);
                    const isCorrect = answers[chosenIdx] === correct;
                    if (isCorrect) score++;

                    const result = isCorrect ? '✅ Correct!' : `❌ Wrong! The correct answer was **${correct}**`;
                    await btn.update({
                        content: `${header}\n\n${result}`,
                        components: [buildRow(answers, labels, true, chosenIdx, correct)],
                    });
                } catch {
                    await interaction.editReply({
                        content: `${header}\n\n⏱️ Time's up! The correct answer was **${correct}**`,
                        components: [buildRow(answers, labels, true, null, correct)],
                    });
                }

                if (idx < questions.length - 1) await new Promise(r => setTimeout(r, 2000));
            }

            await interaction.followUp(`🏆 Final Score: **${score}/${questions.length}**`);
        } catch (err) {
            console.error('Trivia command error:', err);
            try { await interaction.editReply('Failed to fetch trivia questions.'); } catch (e) {}
        }
    },
};
