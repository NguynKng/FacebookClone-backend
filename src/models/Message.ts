import mongoose from 'mongoose'

interface Message extends mongoose.Document {
  senderId: mongoose.Types.ObjectId
  receiverId: mongoose.Types.ObjectId
  text: string
  timestamp: Date
}

const messageSchema = new mongoose.Schema<Message>(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    }
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: false }
  }
)

const MessageModel = mongoose.model<Message>('Message', messageSchema)

export default MessageModel
export type { Message }
