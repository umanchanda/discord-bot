const { SlashCommandBuilder } = require('@discordjs/builders');

function emojifyText(text) {
    const digitMap = {
        '0': '0️⃣','1': '1️⃣','2': '2️⃣','3': '3️⃣','4': '4️⃣',
        '5': '5️⃣','6': '6️⃣','7': '7️⃣','8': '8️⃣','9': '9️⃣'
    };
    let out = '';
    for (const ch of text.toLowerCase()) {
        if (ch >= 'a' && ch <= 'z') {
            out += `:regional_indicator_${ch}: `;
        } else if (ch >= '0' && ch <= '9') {
            out += `${digitMap[ch]} `;
        } else if (ch === ' ') {
            out += '  ';
        } else {
            out += ch + ' ';
        }
    }
    return out.trim();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojify')
        .setDescription('Convert text to regional indicator emojis')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to emojify')
                .setRequired(true)
        ),
    async execute(interaction) {
        const text = interaction.options.getString('text');
        const em = emojifyText(text || '');
        await interaction.reply(em || '');
    },
};
