import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { z } from 'zod'
import crypto from 'node:crypto'
import { checkUserIdExists } from '../middlewares/check-user-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preHandler: [checkSessionIdExists, checkUserIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const user = await knex('users').where('session_id', sessionId).first()

      const meals = await knex('meals').where(`user_id`, user?.id)

      return reply.status(200).send({ meals })
    }
  )
  app.get(
    '/:id',
    { preHandler: [checkSessionIdExists, checkUserIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const idParamsSchema = z.object({
        id: z.string().uuid()
      })
      const { id } = idParamsSchema.parse(request.params)
      const user = await knex('users').where('session_id', sessionId).first()

      const meal = await knex('meals')
        .where('user_id', user?.id)
        .where('id', id)

      return reply.status(200).send({ meal: meal[0] })
    }
  )

  app.post(
    '/',
    { preHandler: [checkSessionIdExists, checkUserIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const createMealSchema = z.object({
        name: z.string(),
        date: z.coerce.date(),
        description: z.string(),
        is_on_diet: z.boolean()
      })

      const { name, description, is_on_diet, date } = createMealSchema.parse(
        request.body
      )
      const user = await knex('users').where('session_id', sessionId).first()

      await knex('meals').insert({
        date: date.getTime(),
        description,
        name,
        is_on_diet,
        id: crypto.randomUUID(),
        user_id: user?.id
      })

      return reply.status(201).send({ success: true })
    }
  )
  app.put(
    '/:id',
    { preHandler: [checkSessionIdExists, checkUserIdExists] },
    async (request, reply) => {
      const requestBodyMealSchema = z.object({
        name: z.string(),
        date: z.coerce.date(),
        description: z.string(),
        is_on_diet: z.boolean()
      })
      const idParamsSchema = z.object({
        id: z.string().uuid()
      })
      const { id } = idParamsSchema.parse(request.params)

      const { name, description, is_on_diet, date } =
        requestBodyMealSchema.parse(request.body)

      const updated = await knex('meals')
        .update({
          date: date.getTime(),
          description,
          name,
          is_on_diet
        })
        .where('id', id)
      if (updated === 0) {
        return reply
          .status(404)
          .send({ success: false, message: 'Meal not found' })
      }

      return reply.status(201).send({ success: true })
    }
  )

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists, checkUserIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const idParamsSchema = z.object({
        id: z.string().uuid()
      })
      const { id } = idParamsSchema.parse(request.params)
      const user = await knex('users').where('session_id', sessionId).first()

      const deleted = await knex('meals')
        .delete()
        .where('user_id', user?.id)
        .where('id', id)
      if (deleted === 0) {
        return reply
          .status(404)
          .send({ success: false, message: 'Meal not found' })
      }
      return reply.status(202).send({ success: true })
    }
  )

  app.get(
    '/metrics',
    { preHandler: [checkSessionIdExists, checkUserIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies
      const user = await knex('users').where('session_id', sessionId).first()

      const mealsCount = await knex('meals')
        .where('user_id', user?.id)
        .count('id', {
          as: 'mealsQuantity'
        })
        .first()

      const onDietMealsCount = await knex('meals')
        .where('user_id', user?.id)
        .where('is_on_diet', true)
        .count('id', {
          as: 'onDietMealsCount'
        })
        .first()

      const outOfDietMealsCount = await knex('meals')
        .where('user_id', user?.id)
        .where('is_on_diet', false)
        .count('id', {
          as: 'outOfDietMealsCount'
        })
        .first()

      const allMeals = await knex('meals')
        .where('user_id', user?.id)
        .orderBy('date', 'desc')

      const { bestOnDietSequence } = allMeals.reduce(
        (acc, meal) => {
          if (meal.is_on_diet) {
            acc.currentSequence = acc.currentSequence + 1
          }
          if (!meal.is_on_diet) {
            acc.currentSequence = 0
          }
          if (acc.currentSequence > acc.bestOnDietSequence) {
            acc.bestOnDietSequence = acc.currentSequence
          }

          return acc
        },
        { bestOnDietSequence: 0, currentSequence: 0 }
      )
      console.log(bestOnDietSequence)

      reply
        .status(200)
        .send({
          ...mealsCount,
          ...onDietMealsCount,
          ...outOfDietMealsCount,
          bestOnDietSequence
        })
    }
  )
}
