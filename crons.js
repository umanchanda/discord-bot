const cron = require('node-cron');
const { fetchWtiMessage } = require('./commands/wti');
const { fetchSsoMessage } = require('./commands/sso');
const { fetchTqqqMessage } = require('./commands/tqqq');
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

    // TQQQ — every 5 min during pre-market (8:30–8:55am), then every 15 min (9am–2pm) M–F
    cron.schedule('30-55/5 8 * * 1-5', async () => {
        const channelId = process.env.TQQQ_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchTqqqMessage();
            if (msg) await send(channelId, msg);
        } catch (err) { console.error('TQQQ cron error:', err); }
    });

    cron.schedule('*/15 9-14 * * 1-5', async () => {
        const channelId = process.env.TQQQ_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchTqqqMessage();
            if (msg) await send(channelId, msg);
        } catch (err) { console.error('TQQQ cron error:', err); }
    });

    // SSO — every 5 min during pre-market (8:30–8:55am), then every 15 min (9am–2pm) M–F
    cron.schedule('30-55/5 8 * * 1-5', async () => {
        const channelId = process.env.SSO_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchSsoMessage();
            if (msg) await send(channelId, msg);
        } catch (err) { console.error('SSO cron error:', err); }
    });

    cron.schedule('*/15 9-14 * * 1-5', async () => {
        const channelId = process.env.SSO_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchSsoMessage();
            if (msg) await send(channelId, msg);
        } catch (err) { console.error('SSO cron error:', err); }
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
}

module.exports = { registerCrons };
