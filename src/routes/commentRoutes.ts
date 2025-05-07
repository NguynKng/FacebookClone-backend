import { FastifyInstance } from 'fastify'
import { commentOnPost, replyToComment, getCommentsByPostId } from '../controllers/commentController'
import { protect } from '../middleware/auth'

export default async function commentRoutes(fastify: FastifyInstance) {
  // Add a comment to a post
  fastify.post('/:postId', { preHandler: [protect] }, commentOnPost)

  // Reply to a comment
  fastify.post('/reply/:postId/:parentCommentId', { preHandler: [protect] }, replyToComment)

  // Get all comments (with replies) by post ID
  fastify.get('/:postId', { preHandler: [protect] }, getCommentsByPostId)
}
