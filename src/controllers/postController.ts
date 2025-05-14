import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify'
import PostModel from '../models/Post'
import { uploadPostFile } from '@/middleware/upload'

// @desc    Create a new post with multiple images
// @route   POST /api/posts
// @access  Private
export const createPost = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await request.parts()
    const userId = (request as any).user?._id
    let content = ''
    const imagesPaths: string[] = []
    let totalParts = 0

    const post = await PostModel.create({
      author: userId,
      content,
      images: []
    })

    for await (const part of data) {
      totalParts++

      if (part.fieldname === 'content') {
        content = part.value as string
      } else if (part.type === 'file' && part.fieldname === 'images') {
        const imagePath = await uploadPostFile(part, userId, post._id.toString())
        imagesPaths.push(imagePath)
      } else if (part.type === 'file') {
        part.file.resume() // Bỏ stream nếu là file không hợp lệ
      }
    }
    console.log('Total parts:', totalParts)
    console.log('Content:', content)

    post.content = content
    post.images = imagesPaths
    await post.save()
    const populatedPost = await PostModel.findById(post._id).populate({
      path: 'author',
      select: 'firstName surname avatar'
    })

    return reply.code(201).send({
      success: true,
      message: 'Created post successfully',
      data: populatedPost
    })
  } catch (error) {
    console.error('Create post error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Lỗi máy chủ',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const getAllPosts = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const posts = await PostModel.find()
      .sort({ createdAt: -1 }) // mới nhất lên đầu
      .populate({
        path: 'author',
        select: 'firstName surname avatar'
      })
      .populate({
        path: 'reactions',
        populate: {
          path: 'user',
          select: 'firstName surname avatar'
        }
      })

    return reply.send({
      success: true,
      message: 'Fetched all posts',
      data: posts
    })
  } catch (error) {
    console.error('Get all posts error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Lỗi máy chủ',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// @desc    Get posts by userId
// @route   GET /api/posts/user/:userId
// @access  Public or Private (tuỳ)
interface GetPostsByUserIdParams extends RouteGenericInterface {
  Params: {
    userId: string
  }
}

export const getPostsByUserId = async (request: FastifyRequest<GetPostsByUserIdParams>, reply: FastifyReply) => {
  const { userId } = request.params

  try {
    const posts = await PostModel.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'author',
        select: 'firstName surname avatar'
      })
      .populate({
        path: 'reactions',
        populate: {
          path: 'user',
          select: 'firstName surname avatar'
        }
      })

    return reply.send({
      success: true,
      message: `Fetched posts by user ${userId}`,
      data: posts
    })
  } catch (error) {
    console.error('Get posts by userId error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Lỗi máy chủ',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

interface GetPostsIdParams extends RouteGenericInterface {
  Params: {
    postId: string
  }
}

export const deletePostById = async (request: FastifyRequest<GetPostsIdParams>, reply: FastifyReply) => {
  const { postId } = request.params

  try {
    const deletedPost = await PostModel.findByIdAndDelete(postId)

    if (!deletedPost) {
      return reply.code(404).send({
        success: false,
        message: `Post with id ${postId} not found.`
      })
    }

    return reply.send({
      success: true,
      message: `Post with id ${postId} has been deleted successfully.`,
      data: deletedPost
    })
  } catch (error) {
    console.error('Delete post error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Lỗi máy chủ',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
