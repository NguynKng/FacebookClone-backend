import dotenv from 'dotenv'

dotenv.config()

export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Facebook_Clone'
export const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key'
export const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d'
export const NODE_ENV = process.env.NODE_ENV || 'development'
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
export const EXPO_URL = process.env.EXPO_URL || 'exp://192.168.2.245:8081'
