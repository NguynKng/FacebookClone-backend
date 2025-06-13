import Fastify from 'fastify'
import { PORT, FRONTEND_URL, JWT_SECRET, EXPO_URL } from './config/envVars'
import { connectDB } from './config/dbConnect'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import fastifyMultipart from '@fastify/multipart'
import fastifySocketIO from 'fastify-socket.io'
import authRoutes from './routes/authRoutes'
import postRoutes from './routes/postRoutes'
import userRoutes from './routes/userRoutes'
import commentRoutes from './routes/commentRoutes'
import messageRoutes from './routes/messageRoutes'
import path from 'path'
import { handleSocketEvents } from './socket'
import notificationRoutes from './routes/notificationRoutes'

const fastify = Fastify({
  logger: true
})

fastify.register(fastifyCors, {
  origin: [FRONTEND_URL, EXPO_URL],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
})

fastify.register(fastifyJwt, {
  secret: JWT_SECRET
})

// Register multipart for file uploads
fastify.register(fastifyMultipart, {
  limits: {
    fieldNameSize: 100, // Max field name size in bytes
    fieldSize: 100, // Max field value size in bytes
    fields: 10, // Max number of non-file fields
    fileSize: 10 * 1024 * 1024, // 10MB limit for file size
    files: 10, // Max number of files
    headerPairs: 2000 // Max number of header key-value pairs
  }
})

// Register static file plugin to serve uploaded files
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/',
  decorateReply: false
})

// Register Socket.IO
fastify.register(fastifySocketIO, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Register route plugins
fastify.register(authRoutes, { prefix: '/api/auth' })
fastify.register(postRoutes, { prefix: '/api/posts' })
fastify.register(userRoutes, { prefix: '/api/users' })
fastify.register(commentRoutes, { prefix: '/api/comments' })
fastify.register(messageRoutes, { prefix: '/api/messages' })
fastify.register(notificationRoutes, { prefix: '/api/notifications' })

// Basic route to test if server is running
fastify.get('/', async () => {
  return 'API is running...'
})

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error)

  // Handle validation errors
  if (error.validation) {
    return reply.code(400).send({
      success: false,
      message: 'Validation error',
      error: error.message
    })
  }

  reply.code(error.statusCode || 500).send({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'production' ? null : error.message
  })
})

async function main() {
  try {
    // Connect to the database
    await connectDB()

    // After Fastify is ready, initialize the Socket.IO events
    fastify.ready((err) => {
      if (err) throw err
      handleSocketEvents(fastify) // Initialize Socket.IO events
    })

    await fastify.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`Server is running at http://localhost:${PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

main()
