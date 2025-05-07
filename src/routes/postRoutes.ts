import { FastifyInstance } from 'fastify'
import { createPost, getAllPosts, getPostsByUserId } from '../controllers/postController'
import { reactToPost } from '@/controllers/reactionController'
import { protect } from '../middleware/auth'

export default async function postRoutes(fastify: FastifyInstance) {
  // Post routes
  fastify.post('/', { preHandler: [protect] }, createPost)
  fastify.get('/user/:userId', { preHandler: [protect] }, getPostsByUserId)
  fastify.get('/', { preHandler: [protect] }, getAllPosts)
  fastify.post('/react', { preHandler: [protect] }, reactToPost)
}
