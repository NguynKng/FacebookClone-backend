import { FastifyInstance } from 'fastify'
import { sseHandler } from '@/controllers/sseController'

export default function sseRoutes(fastify: FastifyInstance) {
  fastify.get('/:UserId', sseHandler)
}
