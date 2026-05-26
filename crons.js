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
}

module.exports = { registerCrons };
