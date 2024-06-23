import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, response) => {
      const { sessionId } = request.cookies

      const transactions = await knex('transactions').where(
        'session_id',
        sessionId
      )

      return response.status(200).send({ transactions })
    }
  )
}
