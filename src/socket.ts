// handleSocketEvents.ts
import { FastifyInstance } from 'fastify'
import { Socket } from 'socket.io'
import MessageModel from './models/Message'
import UserModel from './models/User'
import { setSocketInstance } from './socketInstance'

export function handleSocketEvents(fastify: FastifyInstance) {
  const userSocketMap: { [userId: string]: string } = {}

  // Set io instance globally
  setSocketInstance(fastify.io)

  fastify.io.on('connection', (socket: Socket) => {
    console.log(`[SOCKET CONNECTED] ${socket.id}`)

    socket.on('setup', (userId: string) => {
      if (!userId) return
      userSocketMap[userId] = socket.id
      socket.join(userId) // Join the user to their own room
      console.log(`[USER ONLINE] UserId ${userId} connected`)
      socket.emit('getOnlineUsers', Object.keys(userSocketMap))
      console.log(`[ONLINE USERS] ${Object.keys(userSocketMap).length} users online`)
    })

    // Mở ChatBox => Load lịch sử tin nhắn giữa 2 user
    socket.on('loadChatHistory', async ({ userId1, userId2 }: { userId1: string; userId2: string }) => {
      if (!userId1 || !userId2) return
      try {
        const messages = await MessageModel.find({
          $or: [
            { senderId: userId1, receiverId: userId2 },
            { senderId: userId2, receiverId: userId1 }
          ]
        }).sort({ timestamp: 1 })

        socket.emit('loadChatHistory', messages)
        console.log(`[LOAD HISTORY] Sent ${messages.length} messages between ${userId1} and ${userId2}`)
      } catch (error) {
        console.error('[LOAD HISTORY ERROR]:', error)
      }
    })

    // Gửi tin nhắn
    socket.on(
      'sendMessage',
      async ({
        senderId,
        receiverId,
        text,
        timestamp
      }: {
        senderId: string
        receiverId: string
        text: string
        timestamp: Date
      }) => {
        try {
          console.log(`[SEND MESSAGE] ${senderId} -> ${receiverId}: ${text}`)

          const newMessage = await MessageModel.create({
            senderId,
            receiverId,
            text,
            timestamp: new Date(timestamp)
          })

          const messagePayload = {
            _id: newMessage._id,
            senderId,
            receiverId,
            text,
            timestamp: newMessage.timestamp
          }

          // Gửi tin nhắn cho cả sender lẫn receiver
          if (userSocketMap[receiverId]) {
            fastify.io.to(receiverId).emit('receiveMessage', messagePayload)
          }
          if (userSocketMap[senderId]) {
            fastify.io.to(senderId).emit('receiveMessage', messagePayload)
          }
          const sender = await UserModel.findById(senderId).select('_id firstName surname avatar')
          const receiver = await UserModel.findById(receiverId).select('_id firstName surname avatar')

          fastify.io.to(receiverId).emit('getNewMessage', {
            _id: sender?._id,
            firstName: sender?.firstName,
            surname: sender?.surname,
            avatar: sender?.avatar,
          })

          fastify.io.to(receiverId).emit('newMessage', {
            lastMessage: {
              text: newMessage.text,
              timestamp: newMessage.timestamp
            },
            senderId: senderId,
            receiverId: receiverId,
            participant: {
              _id: sender?._id,
              firstName: sender?.firstName,
              surname: sender?.surname,
              avatar: sender?.avatar
            }
          })
          fastify.io.to(senderId).emit('newMessage', {
            lastMessage: {
              text: newMessage.text,
              timestamp: newMessage.timestamp
            },
            senderId: senderId,
            receiverId: receiverId,
            participant: {
              _id: receiver?._id,
              firstName: receiver?.firstName,
              surname: receiver?.surname,
              avatar: receiver?.avatar
            }
          })

          // Có thể thêm emit notification nếu muốn
        } catch (error) {
          console.error('[SEND MESSAGE ERROR]:', error)
        }
      }
    )

    socket.on('disconnect', () => {
      console.log(`[SOCKET DISCONNECTED] ${socket.id}`)

      for (const userId in userSocketMap) {
        if (userSocketMap[userId] === socket.id) {
          delete userSocketMap[userId]
          break
        }
      }

      socket.emit('getOnlineUsers', Object.keys(userSocketMap))
    })
  })
}
