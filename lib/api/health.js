const basePath = '/api/health'

module.exports = function (fastify) {

    fastify.get(`${basePath}`, async (request, reply) => {
        reply.send({
            status: 'UP'
        })
    })

}
