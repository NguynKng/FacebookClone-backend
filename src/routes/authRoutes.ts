import { FastifyInstance } from 'fastify'
import { register, login, getMe, verifyEmail } from '../controllers/authController'
import { protect } from '../middleware/auth'

export default async function authRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/register', register)
  fastify.post('/login', login)
  fastify.post('/verify-email', verifyEmail)
  fastify.get('/me', { preHandler: [protect] }, getMe)
}
