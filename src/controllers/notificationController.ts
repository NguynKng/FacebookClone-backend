// controllers/notificationController.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import Notification from '../models/Notification'
import { clients } from './sseController'
import UserModel from '@/models/User'
import { Post } from '@/models/Post'

export const createAndSendNotificationToUser = async (
  targetUserId: string,
  actorId: string,
  type: 'react_post' | 'comment_post' | 'new_post' | 'friend_request' | 'accepted_request',
  postId?: string | null,
  populatedPost?: Post | null
) => {
  const actor = await UserModel.findById(actorId).select('firstName surname avatar')
  if (!actor) throw new Error('Actor not found')

  const notification = new Notification({
    user: targetUserId,
    actor: actorId,
    type,
    post: postId,
    content: getNotificationContent(type),
    createdAt: new Date()
  })

  const populatedNotification = await notification.populate('actor', 'firstName surname avatar')

  const client = clients[targetUserId.toString()]
  if (client) {
    const data = JSON.stringify({
      type,
      notification: populatedNotification,
      post: populatedPost
    })
    client.write(`data: ${data}\n\n`)
  }

  await notification.save()
}

export const createAndSendNotificationForFriend = async (
  actorId: string,
  type: 'react_post' | 'comment_post' | 'new_post' | 'friend_request' | 'accepted_request',
  postId?: string,
  populatedPost?: Post
) => {
  const user = await UserModel.findById(actorId).select('friends surname firstName')
  if (!user) {
    throw new Error('User not found')
  }

  const notificationsToSave = []

  for (const friendId of user.friends) {
    if (friendId.toString() === actorId.toString()) continue

    const notification = new Notification({
      user: friendId,
      actor: actorId,
      type,
      post: postId,
      content: getNotificationContent(type),
      createdAt: new Date()
    })

    const populatedNotification = await notification.populate('actor', 'firstName surname avatar')

    const client = clients[friendId.toString()]
    if (client) {
      const data = JSON.stringify({
        type,
        notification: populatedNotification,
        post: populatedPost
      })
      client.write(`data: ${data}\n\n`)
    }

    notificationsToSave.push(notification.save())
  }

  await Promise.all(notificationsToSave)
}

export const getNotificationContent = (
  type: 'react_post' | 'comment_post' | 'new_post' | 'friend_request' | 'accepted_request'
): string => {
  switch (type) {
    case 'react_post':
      return `đã thả cảm xúc vào bài viết của bạn.`
    case 'comment_post':
      return `đã bình luận về bài viết của bạn.`
    case 'new_post':
      return `vừa đăng một bài viết mới.`
    case 'friend_request':
      return `đã gửi cho bạn một lời mời kết bạn.`
    case 'accepted_request':
      return `đã chấp nhận lời mời kết bạn của bạn.`
    default:
      return ''
  }
}

// Lấy danh sách thông báo
export const getNotifications = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request as any).user._id

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('actor', 'firstName surname avatar')
      .populate('post')

    return reply.send({
      success: true,
      data: notifications
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return reply.code(500).send({ success: false, message: 'Lỗi máy chủ' })
  }
}

// Đánh dấu tất cả thông báo chưa đọc là đã đọc
export const markAsAllRead = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request as any).user._id

    // Cập nhật tất cả thông báo chưa đọc thành đã đọc
    const result = await Notification.updateMany({ user: userId, isRead: false }, { $set: { isRead: true } })
    const updatedNotifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('actor', 'firstName surname avatar')
    return reply.send({
      success: true,
      message: `Đã đánh dấu ${result.modifiedCount} thông báo là đã đọc`,
      data: updatedNotifications
    })
  } catch (error) {
    console.error('Mark notifications as read error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Lỗi máy chủ'
    })
  }
}
