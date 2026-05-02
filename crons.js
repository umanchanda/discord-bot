const cron = require('node-cron');
const { fetchBtcMessage } = require('./commands/btc');
const { fetchWtiMessage } = require('./commands/wti');
const { fetchTqqqMessage } = require('./commands/tqqq');

function registerCrons(client, userId) {
    const sendWtiUpdate = async () => {
        const channelId = process.env.WTI_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchWtiMessage();
            if (!msg) return;
            const channel = await client.channels.fetch(channelId);
            await channel.send(`<@${userId}> ${msg}`);
        } catch (err) {
            console.error('WTI cron error:', err);
        }
    };

    // WTI (CME Globex) trading hours: Sun 5 PM – Fri 4 PM CST, with a 4–5 PM CST daily break
    // Mon–Fri midnight to 3:59 PM CST
    cron.schedule('0 0-15/2 * * 1-5', sendWtiUpdate);
    // Sun–Thu 5 PM to 11:59 PM CST (Sunday open + daily reopen after maintenance)
    cron.schedule('0 17-23/2 * * 0-4', sendWtiUpdate);

    cron.schedule('20 13 * * 1-5', async () => {
        const channelId = process.env.WTI_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchWtiMessage();
            if (!msg) return;
            const channel = await client.channels.fetch(channelId);
            await channel.send(`<@${userId}> ${msg} https://kalshi.com/markets/kxwti/wti-oil-on-day/KXWTI-26MAY04?utm_source=kalshiapp_eventpage`);
        } catch (err) {
            console.error('WTI 1:20 PM cron error:', err);
        }
    });

    cron.schedule('30-55/5 8 * * 1-5', async () => {
        const channelId = process.env.TQQQ_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchTqqqMessage();
            if (!msg) return;
            const channel = await client.channels.fetch(channelId);
            await channel.send(`<@${userId}> ${msg}`);
        } catch (err) {
            console.error('TQQQ cron error:', err);
        }
    });

    cron.schedule('*/15 9-15 * * 1-5', async () => {
        const channelId = process.env.TQQQ_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchTqqqMessage();
            if (!msg) return;
            const channel = await client.channels.fetch(channelId);
            await channel.send(`<@${userId}> ${msg}`);
        } catch (err) {
            console.error('TQQQ cron error:', err);
        }
    });

    cron.schedule('55,10,25,40 * * * *', async () => {
        const channelId = process.env.BTC_CHANNEL_ID;
        if (!channelId) return;
        try {
            const msg = await fetchBtcMessage();
            if (!msg) return;
            const channel = await client.channels.fetch(channelId);
            await channel.send(`<@${userId}> ${msg} https://kalshi.com/markets/kxbtc15m/bitcoin-price-up-down?utm_source=kalshiweb_eventpage`);
        } catch (err) {
            console.error('BTC cron error:', err);
        }
    });
}

module.exports = { registerCrons };
