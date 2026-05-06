const { SlashCommandBuilder } = require('@discordjs/builders');
const { PlaidApi, Configuration, PlaidEnvironments } = require('plaid');

function getPlaidClient() {
    return new PlaidApi(new Configuration({
        basePath: PlaidEnvironments.development,
        baseOptions: {
            headers: {
                'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
                'PLAID-SECRET': process.env.PLAID_SECRET,
            },
        },
    }));
}

function formatUSD(amount) {
    if (amount == null) return 'N/A';
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Get your Fidelity account balances'),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET || !process.env.PLAID_ACCESS_TOKEN) {
            return interaction.editReply('Plaid is not configured. Run `node plaid-setup.js` first.');
        }

        try {
            const client = getPlaidClient();
            const response = await client.accountsBalanceGet({
                access_token: process.env.PLAID_ACCESS_TOKEN,
            });

            const accounts = response.data.accounts;
            if (!accounts.length) return interaction.editReply('No accounts found.');

            let total = 0;
            const lines = accounts.map(acct => {
                const balance = acct.balances.current ?? acct.balances.available;
                if (balance != null) total += balance;
                const label = `${acct.name}${acct.mask ? ` (****${acct.mask})` : ''}`;
                return `**${label}**: ${formatUSD(balance)}`;
            });

            lines.push(`\n**Total: ${formatUSD(total)}**`);
            return interaction.editReply(`**Fidelity Balances**\n${lines.join('\n')}`);
        } catch (err) {
            const plaidError = err.response?.data;
            console.error('Balance command error:', plaidError || err.message);
            const msg = plaidError?.error_code === 'ITEM_LOGIN_REQUIRED'
                ? 'Fidelity session expired — re-run `node plaid-setup.js` to reconnect.'
                : 'Failed to fetch balances.';
            return interaction.editReply(msg);
        }
    },
};
