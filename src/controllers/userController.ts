import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify'
import UserModel from '../models/User'
import { uploadFile } from '../middleware/upload'
import { removeDiacritics } from '@/helper/helper'

interface GetUserId extends RouteGenericInterface {
  Params: {
    UserId: string
  }
}

interface GetUserByNameQuery extends RouteGenericInterface {
  Querystring: {
    name: string
  }
}

export const getUserProfileById = async (request: FastifyRequest<GetUserId>, reply: FastifyReply) => {
  try {
    const userId = request.params.UserId

    const user = await UserModel.findById(userId).select('-password')
      .populate({
        path: 'friends',
        select: 'firstName surname avatar' // chỉ lấy các field cần thiết
      })
      .populate({
        path: 'friendRequests',
        select: 'firstName surname avatar'
      })

    if (!user) {
      return reply.code(404).send({
        success: false,
        message: 'User not found'
      })
    }

    return reply.code(200).send({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Get user profile by ID error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const getUserByName = async (request: FastifyRequest<GetUserByNameQuery>, reply: FastifyReply) => {
  try {
    const { name } = request.query

    if (!name || name.trim() === '') {
      return reply.code(400).send({
        success: false,
        message: 'Name query is required'
      })
    }

    const normalizedInput = removeDiacritics(name.toLowerCase())

    const users = await UserModel.find().select('firstName surname email avatar')

    const matchedUsers = users.filter((user) => {
      const fullName = `${user.firstName} ${user.surname}`.toLowerCase()
      const normalizedFullName = removeDiacritics(fullName)
      return normalizedFullName.includes(normalizedInput)
    })

    return reply.code(200).send({
      success: true,
      data: matchedUsers
    })
  } catch (error) {
    console.error('Search user error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Something went wrong'
    })
  }
}

export const updateAvatar = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Handle file upload
    const avatarPath = await uploadFile(request, 'avatar')
    // Update user's avatar field
    const user = await UserModel.findByIdAndUpdate(
      request.user._id,
      {
        avatar: avatarPath
      },
      {
        new: true
      }
    )

    if (!user) {
      return reply.code(404).send({
        success: false,
        message: 'User not found'
      })
    }

    return reply.code(200).send({
      success: true,
      data: {
        avatar: user.avatar
      },
      message: 'Avatar updated successfully'
    })
  } catch (error) {
    console.error('Update avatar error:', error)
    return reply.code(400).send({
      success: false,
      message: error instanceof Error ? error.message : 'Error uploading file'
    })
  }
}

// @desc    Upload user cover photo
// @route   PUT /api/auth/cover-photo
// @access  Private
export const updateCoverPhoto = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Handle file upload
    const coverPath = await uploadFile(request, 'coverPhoto')
    // Update user's coverPhoto field
    const user = await UserModel.findByIdAndUpdate(
      request.user._id,
      {
        coverPhoto: coverPath
      },
      { new: true }
    )

    if (!user) {
      return reply.code(404).send({
        success: false,
        message: 'User not found'
      })
    }

    return reply.code(200).send({
      success: true,
      data: {
        coverPhoto: user.coverPhoto
      },
      message: 'Cover photo updated successfully'
    })
  } catch (error) {
    console.error('Update cover photo error:', error)
    return reply.code(400).send({
      success: false,
      message: error instanceof Error ? error.message : 'Error uploading file'
    })
  }
}

export const sendFriendRequest = async (request: FastifyRequest<GetUserId>, reply: FastifyReply) => {
  try {
    const receiverId = request.params.UserId
    const senderId = request.user._id

    if (receiverId === senderId) {
      return reply.code(400).send({
        success: false,
        message: 'Không thể gửi lời mời cho chính mình'
      })
    }

    const receiver = await UserModel.findById(receiverId)
    if (!receiver)
      return reply.code(404).send({
        success: false,
        message: 'User không tồn tại'
      })

    if (receiver.friendRequests.includes(senderId)) {
      return reply.code(400).send({
        success: false,
        message: 'Đã gửi lời mời trước đó'
      })
    }

    if (receiver.friends.includes(senderId)) {
      return reply.code(400).send({
        success: false,
        message: 'Đã là bạn bè'
      })
    }

    receiver.friendRequests.push(senderId)
    await receiver.save()
    return reply.code(200).send({
      success: true,
      message: 'Đã gửi lời mời kết bạn'
    })
  } catch (error) {
    console.error('Send friend request error:', error)
    return reply.code(500).send({ success: false, message: 'Server error' })
  }
}

export const cancelFriendRequest = async (request: FastifyRequest<GetUserId>, reply: FastifyReply) => {
  try {
    const receiverId = request.params.UserId
    const senderId = request.user._id

    const receiver = await UserModel.findById(receiverId)
    if (!receiver) return reply.code(404).send({ success: false, message: 'User không tồn tại' })

    receiver.friendRequests = receiver.friendRequests.filter((id) => id.toString() !== senderId.toString())
    await receiver.save()

    return reply.code(200).send({ success: true, message: 'Đã hủy lời mời kết bạn' })
  } catch (error) {
    console.error('Cancel request error:', error)
    return reply.code(500).send({ success: false, message: 'Server error' })
  }
}

export const acceptFriendRequest = async (request: FastifyRequest<GetUserId>, reply: FastifyReply) => {
  try {
    const senderId = request.params.UserId
    const receiverId = request.user._id

    const receiver = await UserModel.findById(receiverId)
    const sender = await UserModel.findById(senderId)

    if (!receiver || !sender) return reply.code(404).send({ success: false, message: 'Người dùng không tồn tại' })

    if (!receiver.friendRequests.includes(senderId)) {
      return reply.code(400).send({ success: false, message: 'Không có lời mời từ người này' })
    }

    receiver.friends.push(senderId)
    sender.friends.push(receiverId)

    receiver.friendRequests = receiver.friendRequests.filter((id) => id.toString() !== senderId.toString())

    await receiver.save()
    await sender.save()
    const updateUser = await UserModel.findById(receiverId).select('-password')

    return reply.code(200).send({ success: true, message: 'Đã chấp nhận lời mời kết bạn', data: updateUser })
  } catch (error) {
    console.error('Accept request error:', error)
    return reply.code(500).send({ success: false, message: 'Server error' })
  }
}

export const declineFriendRequest = async (request: FastifyRequest<GetUserId>, reply: FastifyReply) => {
  try {
    const senderId = request.params.UserId
    const receiverId = request.user._id

    const receiver = await UserModel.findById(receiverId)
    if (!receiver) return reply.code(404).send({ success: false, message: 'Người dùng không tồn tại' })

    receiver.friendRequests = receiver.friendRequests.filter((id) => id.toString() !== senderId.toString())
    await receiver.save()
    const updateUser = await UserModel.findById(receiverId).select('-password')

    return reply.code(200).send({ success: true, message: 'Đã từ chối lời mời kết bạn', data: updateUser })
  } catch (error) {
    console.error('Decline request error:', error)
    return reply.code(500).send({ success: false, message: 'Server error' })
  }
}

export const deleteFriend = async (request: FastifyRequest<GetUserId>, reply: FastifyReply) => {
  try {
    const friendId = request.params.UserId
    const userId = request.user._id

    const user = await UserModel.findById(userId)
    const friend = await UserModel.findById(friendId)

    if (!user || !friend) return reply.code(404).send({ success: false, message: 'Người dùng không tồn tại' })

    user.friends = user.friends.filter((id) => id.toString() !== friendId)
    friend.friends = friend.friends.filter((id) => id.toString() !== userId.toString())

    await user.save()
    await friend.save()
    const updateUser = await UserModel.findById(userId).select('-password')

    return reply.code(200).send({ success: true, message: 'Đã xoá bạn', data: updateUser })
  } catch (error) {
    console.error('Delete friend error:', error)
    return reply.code(500).send({ success: false, message: 'Server error' })
  }
}
