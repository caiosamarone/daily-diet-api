import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { z } from 'zod'

export async function userRoutes(app: FastifyInstance) {
  app.post(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
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
      console.log(findByEmail)

      if (findByEmail?.email) {
        return reply
          .status(400)
          .send({ success: false, message: 'User already exists' })
      }
      const newUser = {
        email,
        name,
        imgUrl: imgUrl ?? '',
        session_id: sessionId
      }
      await knex('users').insert(newUser)
      return reply.status(201).send(newUser)
    }
  )
}
