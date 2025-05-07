import { FastifyRequest } from 'fastify'
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { MultipartFile } from '@fastify/multipart'

const uploadsDir = path.join(__dirname, '../../uploads')

if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true })
}

const isValidImageType = (mimetype: string): boolean => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  return allowedMimeTypes.includes(mimetype)
}

export const uploadFile = async (
  request: FastifyRequest,
  fileType: 'avatar' | 'coverPhoto'
): Promise<string | null> => {
  try {
    const userId = (request as any).user?._id
    if (!userId) throw new Error('User not authenticated')

    const data = await request.file()
    if (!data || !isValidImageType(data.mimetype)) {
      throw new Error('Invalid or missing image')
    }

    const userDir = path.join(uploadsDir, 'user', userId.toString(), fileType === 'avatar' ? 'avatar' : 'coverphoto')
    const filePrefix = fileType === 'avatar' ? 'avatar' : 'cover'

    if (!existsSync(userDir)) {
      mkdirSync(userDir, { recursive: true })
    }

    const timestamp = Date.now()
    const ext = path.extname(data.filename).toLowerCase() || '.jpg'
    const filename = `${filePrefix}-${timestamp}${ext}`
    const filepath = path.join(userDir, filename)

    await pipeline(data.file, createWriteStream(filepath))

    return `/uploads/user/${userId}/${fileType}/${filename}`
  } catch (error) {
    console.error('File upload error:', error)
    throw error
  }
}

export const uploadPostFile = async (part: MultipartFile, userId: string, postId: string): Promise<string> => {
  const postDir = path.join('uploads', 'user', userId.toString(), 'posts', postId)
  if (!existsSync(postDir)) {
    mkdirSync(postDir, { recursive: true })
  }

  const timestamp = Date.now()
  const ext = path.extname(part.filename).toLowerCase() || '.jpg'
  const filename = `post-${timestamp}-${Math.random().toString(36).substring(2)}${ext}`
  const filepath = path.join(postDir, filename)

  await pipeline(part.file, createWriteStream(filepath))

  return `/uploads/user/${userId}/posts/${postId}/${filename}`
}
