import { FastifyRequest, FastifyReply } from 'fastify'
import UserModel from '../models/User'

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

    // Check if all required fields are provided
    if (!firstName || !surname || !email || !password || !birthDay || !birthMonth || !birthYear || !gender) {
      return reply.code(400).send({
        success: false,
        message: 'Please provide all required fields'
      })
    }

    // Check if user already exists
    const userExists = await UserModel.findOne({ email })
    if (userExists) {
      return reply.code(400).send({
        success: false,
        message: 'This email already exists'
      })
    }

    // Combine birth date components into a single string
    const birth = `${birthDay}/${birthMonth}/${birthYear}`

    // Create user
    const user = await UserModel.create({
      firstName,
      surname,
      email,
      password,
      birth,
      gender
    })

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
    return reply.code(201).send({
      success: true,
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
    console.error('Register error:', error)
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
