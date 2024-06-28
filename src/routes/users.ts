import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import crypto from 'node:crypto'
export async function userRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createUserSchema = z.object({
      name: z.string(),
      email: z.string(),
      imgUrl: z.string().nullable()
    })

    const { email, imgUrl, name } = createUserSchema.parse(request.body)
    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = crypto.randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
    }

    const findByEmail = await knex('users').where('email', email).first()

    if (findByEmail?.email) {
      return reply
        .status(400)
        .send({ success: false, message: 'User already exists' })
    }
    const newUser = {
      id: crypto.randomUUID(),
      email,
      name,
      imgUrl: imgUrl ?? '',
      session_id: sessionId
    }
    await knex('users').insert(newUser)
    return reply.status(201).send(newUser)
  })

  app.get('/', async (request, reply) => {
    const users = await knex('users').select()
    reply.status(200).send(users)
  })
}
