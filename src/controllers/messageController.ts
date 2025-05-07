import { FastifyRequest, FastifyReply } from 'fastify';
import MessageModel from '@/models/Message';

export const getRecentChats = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user._id;

    const chats = await MessageModel.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }]
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $gt: ['$senderId', '$receiverId'] },
              { senderId: '$receiverId', receiverId: '$senderId' },
              { senderId: '$senderId', receiverId: '$receiverId' }
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.senderId',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.receiverId',
          foreignField: '_id',
          as: 'receiver'
        }
      },
      {
        $project: {
          lastMessage: {
            text: '$lastMessage.text',
            timestamp: '$lastMessage.timestamp',
            isSentByMe: {
              $cond: {
                if: { $eq: ['$lastMessage.senderId', userId] },
                then: true,
                else: false
              }
            }
          },
          senderId: '$lastMessage.senderId',
          receiverId: '$lastMessage.receiverId',
          participant: {
            $cond: {
              if: { $eq: ['$lastMessage.senderId', userId] },
              then: {
                _id: { $arrayElemAt: ['$receiver._id', 0] },
                firstName: { $arrayElemAt: ['$receiver.firstName', 0] },
                surname: { $arrayElemAt: ['$receiver.surname', 0] },
                avatar: { $arrayElemAt: ['$receiver.avatar', 0] }
              },
              else: {
                _id: { $arrayElemAt: ['$sender._id', 0] },
                firstName: { $arrayElemAt: ['$sender.firstName', 0] },
                surname: { $arrayElemAt: ['$sender.surname', 0] },
                avatar: { $arrayElemAt: ['$sender.avatar', 0] }
              }
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.timestamp': -1 }
      }
    ]);

    return reply.code(200).send({ data: chats });
  } catch (error) {
    console.error('❌ getRecentChats error:', error);
    return reply.code(500).send({ message: 'Internal server error' });
  }
};
