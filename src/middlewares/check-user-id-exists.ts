import { FastifyReply, FastifyRequest } from 'fastify'
import { knex } from '../database'

export async function checkUserIdExists(
  request: FastifyRequest,
  response: FastifyReply
) {
  const sessionId = request.cookies.sessionId

  const user = await knex('users').where('session_id', sessionId).first()
  if (!user) return response.status(404).send({ message: 'User not found' })
}
