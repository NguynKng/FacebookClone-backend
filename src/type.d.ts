import 'fastify'
import '@fastify/jwt'
import { Server as IOServer } from 'socket.io'
import { User } from './models/User'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: User
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    io: IOServer
  }
}
