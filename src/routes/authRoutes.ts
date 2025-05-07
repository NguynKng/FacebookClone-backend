import { FastifyInstance } from 'fastify'
import { register, login, getMe } from '../controllers/authController'
import { protect } from '../middleware/auth'

export default async function authRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/register', register)
  fastify.post('/login', login)
  // Protected routes - require authentication
  fastify.get('/me', { preHandler: [protect] }, getMe)
}
