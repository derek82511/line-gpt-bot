const fastify = require('fastify')({
    logger: {
        level: 'info'
    },
    bodyLimit: 104857600
})

const start = async () => {
    await fastify.register(require('fastify-raw-body'), {
        field: 'rawBody',
        global: false,
        encoding: 'utf8',
        runFirst: true,
        routes: []
    })

    // init api
    require('./lib/api/health')(fastify)
    require('./lib/api/line')(fastify)

    try {
        fastify.listen({
            port: 3000,
            host: '0.0.0.0'
        })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()

process.on('SIGTERM', () => {
    console.info('SIGTERM signal received.')
    process.exit(0)
})

process.on('SIGINT', () => {
    console.info('SIGINT signal received.')
    process.exit(0)
})
