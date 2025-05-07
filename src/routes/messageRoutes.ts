import { FastifyInstance } from 'fastify'
import { getRecentChats } from '../controllers/messageController'
import { protect } from '../middleware/auth'

export default async function commentRoutes(fastify: FastifyInstance) {
  // Add a comment to a post
  fastify.get('/', { preHandler: [protect] }, getRecentChats)
}
