import mongoose from 'mongoose'

interface Notification extends mongoose.Document {
  user: mongoose.Types.ObjectId
  actor: mongoose.Types.ObjectId
  type: string
  content: string
  post: mongoose.Types.ObjectId
  isRead: boolean
}

const notificationSchema = new mongoose.Schema<Notification>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['react_post', 'comment_post', 'new_post', 'friend_request', 'accepted_request'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
)

const NotificationModel = mongoose.model<Notification>('Notification', notificationSchema)
export default NotificationModel
export type { Notification }
