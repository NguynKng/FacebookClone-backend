import { FastifyInstance } from 'fastify'
import { getNotifications, markAsAllRead } from '../controllers/notificationController'
import { protect } from '../middleware/auth'

export default async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [protect] }, getNotifications)
  fastify.put('/mark-as-all-read', { preHandler: [protect] }, markAsAllRead)
}
