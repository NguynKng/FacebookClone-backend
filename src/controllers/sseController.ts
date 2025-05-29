import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify'
import { FRONTEND_URL } from '@/config/envVars'

interface GetUserId extends RouteGenericInterface {
  Params: {
    UserId: string
  }
}

export const clients: Record<string, NodeJS.WritableStream> = {} // userId -> raw res

export const sseHandler = (request: FastifyRequest<GetUserId>, reply: FastifyReply) => {
  const { UserId } = request.params

  reply.raw.writeHead?.(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': FRONTEND_URL,
    'Access-Control-Allow-Credentials': 'true'
  })

  // const interval = setInterval(() => {
  //   const data = JSON.stringify({
  //     message: `ping ${new Date().toISOString()}`,
  //     clients: Object.keys(clients)
  //   })
  //   reply.raw.write(`data: ${data}\n\n`)
  // }, 15000) // mỗi 15s

  clients[UserId] = reply.raw

  request.raw.on('close', () => {
    //clearInterval(interval)
    delete clients[UserId]
    console.log(`❌ ${UserId} disconnected`)
  })
}
