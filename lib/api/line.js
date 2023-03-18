const crypto = require('crypto')
const logger = require('pino')()

const channelSecret = process.env.LINE_CHANNEL_SECRET

const lineAPIClient = require('../client/line-api-client')
const chat = require('../service/chat')

const basePath = '/api/line'

function verifySignature(body, expectSignature) {
    const signature = crypto
        .createHmac("SHA256", channelSecret)
        .update(body)
        .digest("base64")
    return signature === expectSignature
}

module.exports = function (fastify) {

    fastify.post(`${basePath}/webhook`, {
        config: {
            rawBody: true
        },
        async handler(request, reply) {
            const lineSignature = request.headers['x-line-signature']

            if (!lineSignature || !verifySignature(request.rawBody, lineSignature)) {
                const userAgent = request.headers['user-agent']
                const xff = request.headers['x-forwarded-for']

                logger.info(`invalid request. user-agent = [${userAgent}] , x-forwarded-for = [${xff}]`)

                return reply.send({})
            }

            const destination = request.body.destination
            const events = request.body.events

            logger.info(`event received. destination = [${destination}]`)
            logger.info(request.body)

            reply.send({})

            if (!!events) {
                for (let i = 0; i < events.length; i++) {
                    const event = events[i]

                    const eventType = event.type
                    const replyToken = event.replyToken
                    const sourceUserId = event.source.userId

                    if (eventType === 'message') {
                        const messageType = event.message.type

                        if (messageType === 'text') {
                            const messageText = event.message.text

                            const responseMessageText = await chat.generateResponse(sourceUserId, messageText)

                            lineAPIClient.replyTextMessage(replyToken, responseMessageText)
                        }
                    }
                }
            }
        }
    })
}
