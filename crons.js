const cron = require('node-cron');
const { fetchBtcMessage } = require('./commands/btc');
const { fetchWtiMessage } = require('./commands/wti');
const { fetchSsoMessage } = require('./commands/sso');
const { fetchSp500Message } = require('./commands/sp500');
const { fetchNasdaqMessage } = require('./commands/nasdaq');
const { fetchBrentMessage } = require('./commands/brent');

function registerCrons(client, userId) {
    const send = async (channelId, content) => {
        const channel = await client.channels.fetch(channelId);
        await channel.send(content);
    };

    // WTI — top of every hour, 8am–5pm M–F
    cron.schedule('0 8-17 * * 1-5', async () => {
        const channelId = process.env.WTI_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchWtiMessage();
            if (msg) await send(channelId, msg);
        } catch (err) { console.error('WTI cron error:', err); }
    });

    // SSO — every 5 min during pre-market (8:30–8:55am), then every 15 min (9am–2pm) M–F
    cron.schedule('30-55/5 8 * * 1-5', async () => {
        const channelId = process.env.TQQQ_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchSsoMessage();
            if (msg) await send(channelId, msg);
        } catch (err) { console.error('SSO cron error:', err); }
    });

    cron.schedule('*/15 9-14 * * 1-5', async () => {
        const channelId = process.env.TQQQ_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchSsoMessage();
            if (msg) await send(channelId, msg);
        } catch (err) { console.error('SSO cron error:', err); }
    });

    // WTI — ping user at 1:20pm M–F
    cron.schedule('20 13 * * 1-5', async () => {
        const channelId = process.env.WTI_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchWtiMessage();
            if (msg) await send(channelId, `<@${userId}> ${msg} https://kalshi.com/markets/kxwti/wti-oil-on-day?utm_source=kalshiweb_eventpage`);
        } catch (err) { console.error('WTI ping cron error:', err); }
    });

    // S&P 500 — ping user at 2:45pm M–F
    cron.schedule('45 14 * * 1-5', async () => {
        const channelId = process.env.SP500_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchSp500Message();
            if (msg) await send(channelId, `<@${userId}> ${msg}`);
        } catch (err) { console.error('SP500 cron error:', err); }
    });

    // Brent — top of every hour, 8am–5pm M–F
    cron.schedule('0 8-17 * * 1-5', async () => {
        const channelId = process.env.BRENT_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchBrentMessage();
            if (msg) await send(channelId, msg);
        } catch (err) { console.error('Brent cron error:', err); }
    });

    // Brent — ping user at 1:20pm M–F
    cron.schedule('20 13 * * 1-5', async () => {
        const channelId = process.env.BRENT_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchBrentMessage();
            if (msg) await send(channelId, `<@${userId}> ${msg}`);
        } catch (err) { console.error('Brent ping cron error:', err); }
    });

    // Brent — ping user at 4:55pm M–F
    cron.schedule('55 16 * * 1-5', async () => {
        const channelId = process.env.BRENT_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchBrentMessage();
            if (msg) await send(channelId, `<@${userId}> ${msg}`);
        } catch (err) { console.error('Brent cron error:', err); }
    });

    // NASDAQ — ping user at 2:45pm M–F
    cron.schedule('45 14 * * 1-5', async () => {
        const channelId = process.env.NASDAQ_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchNasdaqMessage();
            if (msg) await send(channelId, `<@${userId}> ${msg}`);
        } catch (err) { console.error('NASDAQ cron error:', err); }
    });
}

module.exports = { registerCrons };
