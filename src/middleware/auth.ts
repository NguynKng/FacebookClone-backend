import { FastifyRequest, FastifyReply } from 'fastify'
import UserModel from '../models/User'

// Middleware to protect routes - only authenticated users can access
export const protect = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization
    let token
    // Check if authorization header exists and starts with 'Bearer'
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Get token from header
      token = authHeader.split(' ')[1]
    }

    // Check if token exists
    if (!token) {
      return reply.code(401).send({
        success: false,
        message: 'Not authorized to access this route'
      })
    }

    try {
      // Verify token using fastify's JWT plugin
      const decoded = await request.server.jwt.verify<{ id: string }>(token)

      // Get user from database using ID from token
      const user = await UserModel.findById(decoded.id)

      // Check if user exists
      if (!user) {
        return reply.code(401).send({
          success: false,
          message: 'User not found'
        })
      }

      // Add user to request object
      request.user = user
    } catch (error) {
      return reply.code(401).send({
        success: false,
        message: 'Not authorized to access this route'
      })
    }
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
