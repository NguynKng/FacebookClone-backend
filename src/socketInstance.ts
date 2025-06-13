import { Server as SocketIOServer } from 'socket.io'

let io: SocketIOServer

export const setSocketInstance = (instance: SocketIOServer) => {
  io = instance
}

export const getSocketInstance = (): SocketIOServer => {
  if (!io) throw new Error('Socket instance not initialized')
  return io
}
