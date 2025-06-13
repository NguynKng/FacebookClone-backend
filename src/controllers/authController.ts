import { FastifyRequest, FastifyReply } from 'fastify'
import UserModel from '../models/User'
import { validateEmail } from '@/utils/validateFunction'

type VerifyRequest = FastifyRequest<{
  Body: {
    email: string
    code: string
  }
}>

// Custom request types
type RegisterRequest = FastifyRequest<{
  Body: {
    firstName: string
    surname: string
    email: string
    password: string
    birthDay: string
    birthMonth: string
    birthYear: string
    gender: string
  }
}>

type EmailExistsRequest = FastifyRequest<{
  Body: {
    email: string
  }
}>

type LoginRequest = FastifyRequest<{
  Body: {
    email: string
    password: string
  }
}>

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (request: RegisterRequest, reply: FastifyReply) => {
  try {
    const { firstName, surname, email, password, birthDay, birthMonth, birthYear, gender } = request.body

    if (!firstName || !surname || !email || !password || !birthDay || !birthMonth || !birthYear || !gender) {
      return reply.code(400).send({ success: false, message: 'Please provide all required fields' })
    }

    if (!validateEmail(email)) {
      return reply.code(400).send({ success: false, message: 'Invalid email format' })
    }

    const userExists = await UserModel.findOne({ email })
    if (userExists) {
      return reply.code(400).send({ success: false, message: 'This email already exists' })
    }

    const birth = `${birthDay}/${birthMonth}/${birthYear}`

    const verificationCode = '123456'

    const user = await UserModel.create({
      firstName,
      surname,
      email,
      password,
      birth,
      gender,
      isVerified: false,
      verificationCode
    })

    return reply.code(201).send({
      success: true,
      message: 'Registered successfully. Please verify your email.',
      email: user.email
    })
  } catch (error) {
    console.error('Register error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const isExistingEmail = async (request: EmailExistsRequest, reply: FastifyReply) => {
  try {
    const { email } = request.body

    if (!email) {
      return reply.code(400).send({ success: false, message: 'Email is required' })
    }

    if (!validateEmail(email)) {
      return reply.code(400).send({ success: false, message: 'Invalid email format' })
    }

    const userExists = await UserModel.findOne({ email })

    if (userExists) {
      return reply.code(200).send({ success: true, exists: true })
    } else {
      return reply.code(200).send({ success: true, exists: false })
    }
  } catch (error) {
    console.error('Email existence check error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const verifyEmail = async (request: VerifyRequest, reply: FastifyReply) => {
  try {
    const { email, code } = request.body

    const user = await UserModel.findOne({ email })

    if (!user) {
      return reply.code(404).send({ success: false, message: 'User not found' })
    }

    if (user.verificationCode !== code) {
      return reply.code(400).send({ success: false, message: 'Invalid verification code' })
    }

    user.isVerified = true
    user.verificationCode = 'null'
    await user.save()

    const token = await reply.jwtSign({ id: user._id }, { expiresIn: process.env.JWT_EXPIRE || '30d' })

    return reply.code(200).send({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        surname: user.surname,
        email: user.email,
        avatar: user.avatar,
        coverPhoto: user.coverPhoto
      }
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (request: LoginRequest, reply: FastifyReply) => {
  try {
    const { email, password } = request.body

    // Check if email and password are provided
    if (!email || !password) {
      return reply.code(400).send({
        success: false,
        message: 'Please provide email and password'
      })
    }

    // Find user by email and include password for verification
    const user = await UserModel.findOne({ email }).select('+password')

    // Check if user exists
    if (!user) {
      return reply.code(401).send({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password)

    if (!isMatch) {
      return reply.code(401).send({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Generate token using Fastify JWT
    const token = await reply.jwtSign(
      {
        id: user._id
      },
      {
        expiresIn: process.env.JWT_EXPIRE || '30d'
      }
    )

    // Send response
    return reply.code(200).send({
      success: true,
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        surname: user.surname,
        email: user.email,
        avatar: user.avatar,
        coverPhoto: user.coverPhoto,
        friends: user.friends,
        friendRequests: user.friendRequests
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // User is already available from auth middleware
    const user = await UserModel.findById(request.user._id)
    return reply.code(200).send({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Get me error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
