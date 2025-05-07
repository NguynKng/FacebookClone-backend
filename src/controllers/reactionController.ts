import { FastifyRequest, FastifyReply } from 'fastify'
import ReactionModel from '@/models/Reaction'
import PostModel from '@/models/Post'
import mongoose from 'mongoose'

export const reactToPost = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user._id
    const { postId, type } = request.body as {
      postId: string
      type: 'Like' | 'Love' | 'Care' | 'Haha' | 'Wow' | 'Sad' | 'Angry'
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return reply.code(400).send({ message: 'Invalid post ID', success: false })
    }

    const post = await PostModel.findById(postId)
    if (!post) return reply.code(404).send({ message: 'Post not found', success: false })

    const existing = await ReactionModel.findOne({ user: userId, post: postId }).populate(
      'user',
      'firstName surname avatar'
    )

    if (existing) {
      if (existing.type === type) {
        // Remove reaction
        await existing.deleteOne()

        // Remove reaction._id from post.reactions
        post.reactions = post.reactions.filter((r) => !r.equals(existing._id))
        await post.save()

        return reply.code(200).send({ message: 'Reaction removed', success: true })
      } else {
        // Update reaction type
        existing.type = type
        await existing.save()
        return reply.code(200).send({ message: 'Reaction updated', success: true, data: existing })
      }
    }

    // Create new reaction
    const newReaction = await ReactionModel.create({
      user: userId,
      post: postId,
      type
    })

    post.reactions.push(newReaction._id)
    await post.save()
    const populatedReaction = await newReaction.populate('user', 'firstName surname avatar')

    return reply.code(201).send({ message: 'Reacted successfully', success: true, data: populatedReaction })
  } catch (error) {
    console.error('❌ reactToPost error:', error)
    return reply.code(500).send({ message: 'Internal server error', success: false })
  }
}
