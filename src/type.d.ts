import 'fastify'
import { User } from './models/User'

declare module 'fastify' {
  interface FastifyRequest {
    user: User
  }
}
