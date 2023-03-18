const logger = require('pino')()

const chatSession = require('./chat-session')

const lineAPIClient = require('../client/line-api-client')
const openaiAPIClient = require('../client/openai-api-client')

// const LEGACY_MODEL = process.env.CHAT_LEGACY_MODEL
// const LEGACY_CONVERSATION_CONTEXT_PREFIX = 'You are now playing the role of [Receiver] and your task is to respond to [Sender] in the conversation below. Your response should not exceed 100 words. Please respond in the language used by [Sender].'
// const LEGACY_CONVERSATION_CONTEXT_SUFFIX = '[Receiver]:'
// const LEGACY_TIMEOUT_CONTEXT_PREFIX = 'You are now playing the role of [Receiver] and your task is to respond to [Sender] in the conversation below. Your response should not exceed 100 words. Please append a message which telling [Sender] that the session is timeout. Please respond in the language used by [Sender].'
// const LEGACY_TIMEOUT_CONTEXT_SUFFIX = '[Receiver]:'

const MODEL = process.env.CHAT_MODEL
const CONVERSATION_START_PROMPT = 'Please provide a text in traditional Chinese to inform the user that a conversation has started.'
const CONVERSATION_CONTEXT_PREFIX = 'You are a helpful assistant.'
const TIMEOUT_CONTEXT_PREFIX = 'You are a helpful assistant. No matter what the context of the conversation is, Please append a message which telling user that the session is timeout.'

const chat = {}

chat.generateResponse = async function (uid, senderMessageText) {
    if (!chatSession.isNotEmpty(uid)) {
        chatSession.addMessageText(uid, -1, senderMessageText)

        return await generateChatCompletionWithSimpleText(uid, CONVERSATION_START_PROMPT)
    }

    chatSession.addMessageText(uid, 0, senderMessageText)

    const receiverMessageText = await generateChatCompletionWithContext(uid, CONVERSATION_CONTEXT_PREFIX)

    chatSession.addMessageText(uid, 1, receiverMessageText, sessionTimeoutCallback)

    return receiverMessageText
}

async function sessionTimeoutCallback(_uid) {
    const messageText = await generateChatCompletionWithContext(_uid, TIMEOUT_CONTEXT_PREFIX)

    lineAPIClient.pushTextMessage(_uid, messageText)
}

// async function generateCompletionWithContext(uid, prefix, suffix) {
//     const sessionData = chatSession.getSessionData(uid)

//     let prompt = `${prefix}\n\n`

//     for (let i = 0; i < sessionData.messages.length; i++) {
//         let message = sessionData.messages[i]

//         prompt += `${message.type === 0 ? '[Sender]' : '[Receiver]'}:${message.text}\n\n`
//     }

//     prompt += suffix

//     const data = await openaiAPIClient.createCompletion(LEGACY_MODEL, prompt)
//     logger.info(data)

//     if (!data || !data.id) {
//         logger.info(`completion failed from openai. uid = [${uid}]`)
//         return null
//     }

//     logger.info(`completion from openai. uid = [${uid}] , id = [${data.id}]`)

//     if (!data || !data.choices || !data.choices[0] || (typeof data.choices[0].text) != 'string') {
//         logger.info(`invalid choices from openai. uid = [${uid}] , id = [${data.id}]`)
//         return null
//     }

//     return data.choices[0].text.trim()
// }

async function generateChatCompletionWithContext(uid, prefix) {
    const sessionData = chatSession.getSessionData(uid)

    const messages = []

    for (let i = 0; i < sessionData.messages.length; i++) {
        let message = sessionData.messages[i]

        if (message.type === -1) {
            messages.push(openaiAPIClient.generateChatMessage('system', `${prefix} ${message.text === '0' ? '' : `Please make sure to follow the guidelines for answering: "${message.text}"`}`))
        } else if (message.type === 0) {
            messages.push(openaiAPIClient.generateChatMessage('user', message.text))
        } else if (message.type === 1) {
            messages.push(openaiAPIClient.generateChatMessage('assistant', message.text))
        }
    }

    const data = await openaiAPIClient.createChatCompletion(MODEL, messages)
    logger.info(data)

    if (!data || !data.id) {
        logger.info(`chat completion failed from openai. uid = [${uid}]`)
        return null
    }

    logger.info(`chat completion from openai. uid = [${uid}] , id = [${data.id}]`)

    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || data.choices[0].message.role !== 'assistant' || (typeof data.choices[0].message.content) != 'string') {
        logger.info(`invalid choices from openai. uid = [${uid}] , id = [${data.id}]`)
        return null
    }

    return data.choices[0].message.content.trim()
}

async function generateChatCompletionWithSimpleText(uid, text) {
    const messages = []

    messages.push(openaiAPIClient.generateChatMessage('user', text))

    const data = await openaiAPIClient.createChatCompletion(MODEL, messages)
    logger.info(data)

    if (!data || !data.id) {
        logger.info(`chat completion failed from openai. uid = [${uid}]`)
        return null
    }

    logger.info(`chat completion from openai. uid = [${uid}] , id = [${data.id}]`)

    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || data.choices[0].message.role !== 'assistant' || (typeof data.choices[0].message.content) != 'string') {
        logger.info(`invalid choices from openai. uid = [${uid}] , id = [${data.id}]`)
        return null
    }

    return data.choices[0].message.content.trim()
}

module.exports = chat
