const logger = require('pino')()
const line = require('@line/bot-sdk')

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN

const lineClient = new line.Client({
    channelAccessToken: channelAccessToken
})

const client = {}

client.replyTextMessage = async function (replyToken, content) {
    const message = {
        type: 'text',
        text: content
    }
    const res = await lineClient.replyMessage(replyToken, message)

    return res
}

client.pushTextMessage = async function (to, content) {
    const message = {
        type: 'text',
        text: content
    }
    const res = await lineClient.pushMessage(to, message)

    return res
}

module.exports = client
