import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { z } from 'zod'

export async function mealsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, response) => {
      const { sessionId } = request.cookies

      const transactions = await knex('meals').where('session_id', sessionId)

      return response.status(200).send({ transactions })
    }
  )

  // app.post(
  //   '/',
  //   { preHandler: [checkSessionIdExists] },
  //   async (request, response) => {
  //     const { sessionId } = request.cookies

  //     const createMealSchema = z.object({
  //       name: z.string(),
  //       description: z.string()
  //     })

  //     const { email, imgUrl, name } = createUserSchema.parse(request.body)
  //   }
  // )
}
