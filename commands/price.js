const { SlashCommandBuilder } = require('@discordjs/builders');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

// Each asset maps a /price choice to a Yahoo Finance symbol plus its display formatting.
//   dollar:      prefix the price with `$` (default true; false for index points)
//   suffix:      appended after the price, e.g. `/barrel`
//   comma:       group the price with thousands separators
//   commaChange: group the change value too (indices report large point moves)
const ASSETS = {
    wti:    { symbol: 'CL=F',    label: 'WTI Crude Oil (CL=F)',   name: 'WTI',      suffix: '/barrel' },
    brent:  { symbol: 'BZ=F',    label: 'Brent Crude Oil (BZ=F)', name: 'Brent',    suffix: '/barrel' },
    btc:    { symbol: 'BTC-USD', label: 'Bitcoin Price',          name: 'Bitcoin',  comma: true },
    sp500:  { symbol: '^GSPC',   label: 'S&P 500',                name: 'S&P 500',  dollar: false, comma: true, commaChange: true },
    nasdaq: { symbol: '^IXIC',   label: 'NASDAQ',                 name: 'NASDAQ',   dollar: false, comma: true, commaChange: true },
    tqqq:   { symbol: 'TQQQ',    label: 'TQQQ',                   name: 'TQQQ' },
    sso:    { symbol: 'SSO',     label: 'SSO',                    name: 'SSO' },
    goog:   { symbol: 'GOOGL',   label: 'GOOGL',                  name: 'GOOGL' },
    nvda:   { symbol: 'NVDA',    label: 'NVIDIA (NVDA)',          name: 'NVIDIA' },
};

const CHOICES = [
    { name: 'WTI Crude Oil', value: 'wti' },
    { name: 'Brent Crude Oil', value: 'brent' },
    { name: 'Bitcoin', value: 'btc' },
    { name: 'S&P 500', value: 'sp500' },
    { name: 'NASDAQ', value: 'nasdaq' },
    { name: 'TQQQ', value: 'tqqq' },
    { name: 'SSO', value: 'sso' },
    { name: 'Google (GOOGL)', value: 'goog' },
    { name: 'NVIDIA (NVDA)', value: 'nvda' },
];

const comma2 = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatQuote(asset, quote) {
    const dollar = asset.dollar === false ? '' : '$';
    const suffix = asset.suffix ?? '';
    const price = asset.comma ? comma2(quote.regularMarketPrice) : quote.regularMarketPrice.toFixed(2);
    const change = asset.commaChange ? comma2(quote.regularMarketChange) : quote.regularMarketChange.toFixed(2);
    const changePct = quote.regularMarketChangePercent.toFixed(2);
    const sign = quote.regularMarketChange >= 0 ? '+' : '';
    return `${asset.label}: **${dollar}${price}${suffix}** (${sign}${change}, ${sign}${changePct}%)`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('price')
        .setDescription('Get the latest price for a stock, index, ETF, or commodity')
        .addStringOption(opt =>
            opt.setName('asset')
                .setDescription('Which asset?')
                .setRequired(true)
                .addChoices(...CHOICES)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const key = interaction.options.getString('asset');
        const asset = ASSETS[key];
        if (!asset) return interaction.editReply('Unknown asset.');
        try {
            const quote = await yahooFinance.quote(asset.symbol);
            if (!quote || quote.regularMarketPrice == null) {
                return interaction.editReply(`No ${asset.name} price data available right now.`);
            }
            return interaction.editReply(formatQuote(asset, quote));
        } catch (err) {
            console.error(`price command error (${key}):`, err);
            try { await interaction.editReply(`Failed to fetch ${asset.name} price.`); } catch (e) {}
        }
    },
};
