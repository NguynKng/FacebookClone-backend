import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

// Define the User interface
interface User extends mongoose.Document {
  firstName: string
  surname: string
  email: string
  password: string
  avatar: string
  coverPhoto: string
  birth: string
  gender: string
  friends: mongoose.Types.ObjectId[]
  friendRequests: mongoose.Types.ObjectId[]
  createdAt: Date
  // Methods for the user model
  matchPassword(enteredPassword: string): Promise<boolean>
}

// Create a schema for User
const UserSchema = new mongoose.Schema<User>({
  firstName: {
    type: String,
    required: [true, 'Please add a first name']
  },
  surname: {
    type: String,
    required: [true, 'Please add a surname']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false // Don't return password by default
  },
  avatar: {
    type: String
  },
  coverPhoto: {
    type: String
  },
  birth: {
    type: String,
    required: [true, 'Please add birth date']
  },
  gender: {
    type: String,
    required: [true, 'Please add a gender'],
    enum: ['male', 'female', 'other']
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  friendRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Hash password before saving user
UserSchema.pre('save', async function (next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) {
    next()
    return
  }

  // Generate a salt
  const salt = await bcrypt.genSalt(10)
  // Hash the password using the salt
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Method to check if entered password matches stored password
UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password)
}

const UserModel = mongoose.model<User>('User', UserSchema)
// Create and export the model
export default UserModel
export type { User }
