const logger = require('pino')()

const sessionDataMap = new Map()

const TIMEOUT_IN_MILLISECOND = process.env.CHAT_SESSION_TIMEOUT * 1000 || 20 * 1000

const chatSession = {}

function expireSessionData(uid, sessionTimeoutCallback) {
    return setTimeout(() => {
        if (!!sessionTimeoutCallback) {
            sessionTimeoutCallback(uid)
        }

        sessionDataMap.delete(uid)

        logger.info(`user session timeout. uid = [${uid}]`)
    }, TIMEOUT_IN_MILLISECOND)
}

chatSession.addMessageText = function (uid, messageType, messageText, sessionTimeoutCallback) {
    if (!sessionDataMap.has(uid)) {
        sessionDataMap.set(uid, {
            uid: uid,
            messages: [],
            timer: null
        })
        logger.info(`user initial a session. uid = [${uid}]`)
    }

    const sessionData = sessionDataMap.get(uid)

    sessionData.messages.push({
        type: messageType, // -1 : system, 0 : sender , 1 : receiver
        text: messageText
    })

    if (!!sessionData.timer) {
        clearTimeout(sessionData.timer)
    }
    sessionData.timer = expireSessionData(uid, sessionTimeoutCallback)
}

chatSession.isNotEmpty = function (uid) {
    return sessionDataMap.has(uid)
}

chatSession.getSessionData = function (uid) {
    return sessionDataMap.get(uid)
}

module.exports = chatSession
