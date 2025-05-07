import mongoose from 'mongoose'

const REACTION_TYPES = ['Like', 'Love', 'Care', 'Haha', 'Wow', 'Sad', 'Angry'] as const
type ReactionType = (typeof REACTION_TYPES)[number]

interface Reaction extends mongoose.Document {
  user: mongoose.Types.ObjectId
  post?: mongoose.Types.ObjectId
  type: ReactionType
  createdAt: Date
}

const ReactionSchema = new mongoose.Schema<Reaction>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    type: {
      type: String,
      enum: REACTION_TYPES,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
)

const ReactionModel = mongoose.model<Reaction>('Reaction', ReactionSchema)

export default ReactionModel
export type { Reaction }
