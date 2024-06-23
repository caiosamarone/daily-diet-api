import fastify from 'fastify'

import cookie from '@fastify/cookie'
import { userRoutes } from './routes/users'

export const app = fastify()

app.register(cookie)

app.addHook('preHandler', async (request, response) => {
  console.log(
    `[${request.method}] ${request.url} \n  ${request.method !== 'GET' ? `[BODY]: ${JSON.stringify(request.body)}` : ''}`
  )
}) //MIDDLEWARE GLOBAL

app.register(userRoutes, {
  prefix: 'user'
})
app.get('/healthCheck', (request, response) => {
  response.send('OK, API running')
})
