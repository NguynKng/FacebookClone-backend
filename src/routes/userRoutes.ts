import { FastifyInstance } from 'fastify'
import { protect } from '../middleware/auth'
import {
  updateAvatar,
  updateCoverPhoto,
  getUserProfileById,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  deleteFriend,
  getUserByName
} from '@/controllers/userController'

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.put('/avatar', { preHandler: [protect] }, updateAvatar)
  fastify.put('/cover-photo', { preHandler: [protect] }, updateCoverPhoto)
  fastify.get('/profile/:UserId', { preHandler: [protect] }, getUserProfileById)
  fastify.post('/friend-request/:UserId', { preHandler: [protect] }, sendFriendRequest)
  fastify.delete('/friend-request/:UserId', { preHandler: [protect] }, cancelFriendRequest)
  fastify.post('/friend-request/accept/:UserId', { preHandler: [protect] }, acceptFriendRequest)
  fastify.delete('/friend-request/decline/:UserId', { preHandler: [protect] }, declineFriendRequest)
  fastify.delete('/friend/:UserId', { preHandler: [protect] }, deleteFriend)
  fastify.get('/search', { preHandler: [protect] }, getUserByName)
}
