import mongoose from 'mongoose'

// Define the Post interface
interface Post extends mongoose.Document {
  author: mongoose.Types.ObjectId
  content: string
  images?: string[] // ✅ Updated from 'image' to 'images'
  reactions: mongoose.Types.ObjectId[]
  comments: mongoose.Types.ObjectId[]
  createdAt: Date
}

// Create schema for Post
const PostSchema = new mongoose.Schema<Post>({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String
  },
  images: [
    // ✅ Updated field
    {
      type: String // URL to image
    }
  ],
  reactions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reaction'
    }
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Create and export the model
const PostModel = mongoose.model<Post>('Post', PostSchema)

export default PostModel
export type { Post }
