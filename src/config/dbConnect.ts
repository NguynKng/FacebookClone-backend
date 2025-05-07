import mongoose from 'mongoose'
import { MONGO_URI } from './envVars'

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI)
    console.log(`MongoDB connected ${conn.connection.host}`)
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}
