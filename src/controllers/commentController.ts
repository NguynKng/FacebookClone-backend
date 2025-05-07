import { FastifyReply, FastifyRequest, RouteGenericInterface } from 'fastify'
import CommentModel from '../models/Comment'

// ─────────────────────────────────────────────
// Define interfaces for each route
interface CommentOnPostRoute extends RouteGenericInterface {
  Params: { postId: string }
  Body: { content: string }
}

interface ReplyToCommentRoute extends RouteGenericInterface {
  Params: { postId: string; parentCommentId: string }
  Body: { content: string }
}

interface GetCommentsRoute extends RouteGenericInterface {
  Params: { postId: string }
}

// ─────────────────────────────────────────────
// POST /api/comments/:postId
export const commentOnPost = async (request: FastifyRequest<CommentOnPostRoute>, reply: FastifyReply) => {
  try {
    const { postId } = request.params
    const { content } = request.body
    const userId = (request as any).user?._id

    const comment = await CommentModel.create({
      post: postId,
      user: userId,
      content
    })

    const populatedComment = await comment.populate('user', 'firstName surname avatar')

    return reply.code(201).send({
      success: true,
      message: 'Comment added',
      data: populatedComment
    })
  } catch (error) {
    console.error('Comment post error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Lỗi khi bình luận',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// ─────────────────────────────────────────────
// POST /api/comments/reply/:postId/:parentCommentId
export const replyToComment = async (request: FastifyRequest<ReplyToCommentRoute>, reply: FastifyReply) => {
  try {
    const { postId, parentCommentId } = request.params
    const { content } = request.body
    const userId = (request as any).user?._id

    const replyComment = await CommentModel.create({
      post: postId,
      user: userId,
      content,
      parent: parentCommentId
    })

    const populatedReply = await replyComment.populate('user', 'firstName surname avatar')

    return reply.code(201).send({
      success: true,
      message: 'Reply added',
      data: populatedReply
    })
  } catch (error) {
    console.error('Reply error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Lỗi khi phản hồi bình luận',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// ─────────────────────────────────────────────
// GET /api/comments/:postId
export const getCommentsByPostId = async (request: FastifyRequest<GetCommentsRoute>, reply: FastifyReply) => {
  try {
    const { postId } = request.params

    const comments = await CommentModel.find({ post: postId, parent: null })
      .populate('user', 'firstName surname avatar')
      .sort({ createdAt: -1 })

    // Fetch nested replies
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await CommentModel.find({ parent: comment._id })
          .populate('user', 'firstName surname avatar')
          .sort({ createdAt: 1 })

        return {
          ...comment.toObject(),
          replies
        }
      })
    )

    return reply.send({
      success: true,
      message: 'Fetched comments and replies',
      data: commentsWithReplies
    })
  } catch (error) {
    console.error('Get comments error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Lỗi khi lấy bình luận',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
