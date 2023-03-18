const logger = require('pino')()
const { Configuration, OpenAIApi } = require('openai')

const organization = process.env.OPENAI_ORGANIZATION
const apiKey = process.env.OPENAI_API_KEY

const configuration = new Configuration({
    organization: organization,
    apiKey: apiKey,
})
const openai = new OpenAIApi(configuration)

const client = {}

client.createCompletion = async function (model, prompt) {
    let response = await openai.createCompletion({
        model: model,
        prompt: prompt,
        suffix: null,
        max_tokens: 1000,
        temperature: 0.2,
        top_p: 1,
        n: 1,
        stream: false,
        logprobs: null,
        echo: false,
        stop: null,
        presence_penalty: 0,
        frequency_penalty: 0,
        best_of: 1,
        // logit_bias: null,
        // user: '',
    })

    return response.data
}

client.createChatCompletion = async function (model, messages) {
    let response = await openai.createChatCompletion({
        model: model,
        messages: messages,
        temperature: 0.2,
        top_p: 1,
        n: 1,
        stream: false,
        stop: null,
        // max_tokens: 9999,
        presence_penalty: 0,
        frequency_penalty: 0,
        // logit_bias: null,
        // user: '',
    })

    return response.data
}

client.generateChatMessage = function (role, content) {
    return {
        role: role,
        content: content
    }
}

module.exports = client
