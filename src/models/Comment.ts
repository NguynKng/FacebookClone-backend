import mongoose from 'mongoose'

interface Comment extends mongoose.Document {
  user: mongoose.Types.ObjectId
  content: string
  post: mongoose.Types.ObjectId
  parent: mongoose.Types.ObjectId
  createdAt: Date
}

const commentSchema = new mongoose.Schema<Comment>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
)

const CommentModel = mongoose.model<Comment>('Comment', commentSchema)

export default CommentModel
export type { Comment }
