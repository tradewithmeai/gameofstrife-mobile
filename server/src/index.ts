import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifySocketIO from 'fastify-socket.io'
import { Socket } from 'socket.io'
import { RoomManager } from './services/roomManager.js'
import { Matchmaker } from './services/matchmaker.js'
import { MatchService } from './services/matchService.js'
import { GameRegistry } from './services/gameRegistry.js'
import { ClientToServerEvents, ServerToClientEvents, Room } from './types/room.js'

// Game of Strife Mobile Backend
console.log('='.repeat(50))
console.log('Game of Strife - Mobile Backend')
console.log('ENGINE: Game of Strife (hardcoded)')
console.log('='.repeat(50))

// Single namespace constant
export const NAMESPACE = '/game'

// Create global service instances
const roomManager = new RoomManager()
const matchmaker = new Matchmaker()
const matchService = new MatchService() // Auto-loads GameOfStrifeEngine

// Track emitted results to ensure exactly-once emission
const emittedResults = new Set<string>()

// Configuration
const PORT = parseInt(process.env.PORT || '3030', 10)
const HOST = process.env.HOST || '0.0.0.0'
const MATCH_MODE = process.env.MATCH_MODE || 'turn'

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
  },
})

await fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST'],
  credentials: true,
})

await fastify.register(fastifySocketIO, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Health check endpoint
fastify.get('/health', async (_request, _reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    engine: 'gameofstrife',
    matchMode: MATCH_MODE,
  }
})

// Socket.IO namespace
const gameNamespace = fastify.io.of(NAMESPACE)

gameNamespace.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log(`Client connected: ${socket.id}`)

  // Create room
  socket.on('createRoom', ({ isPublic, gameSettings }) => {
    const room = roomManager.createRoom(socket.id, isPublic, gameSettings)
    socket.join(room.id)
    socket.emit('roomCreated', room)
    console.log(`Room created: ${room.code} by ${socket.id}`)
  })

  // Join room
  socket.on('joinRoom', (code: string) => {
    const room = roomManager.joinRoom(code, socket.id)
    if (!room) {
      socket.emit('error', { message: 'Room not found or full' })
      return
    }

    socket.join(room.id)
    gameNamespace.to(room.id).emit('roomUpdated', room)

    // Start match when 2 players
    if (room.players.length === 2) {
      const matchId = matchService.createMatch(room.id, room.players.map(p => p.id), room.gameSettings)
      const matchState = matchService.getMatch(matchId)

      if (matchState) {
        gameNamespace.to(room.id).emit('matchStarted', {
          matchId,
          matchState,
          playerSeats: {
            [room.players[0].id]: 'P1',
            [room.players[1].id]: 'P2'
          }
        })
      }
    }
  })

  // Get public rooms
  socket.on('getPublicRooms', () => {
    const rooms = roomManager.getPublicRooms()
    socket.emit('publicRooms', rooms)
  })

  // Claim square
  socket.on('claimSquare', ({ matchId, squareId, selectionId, superpowerType }) => {
    const result = matchService.claimSquare({
      matchId,
      squareId,
      selectionId,
      playerId: socket.id,
      superpowerType
    })

    const roomId = GameRegistry.getRoomIdByMatchId(matchId)
    if (!roomId) return

    if (result.success && result.matchState) {
      gameNamespace.to(roomId).emit('stateSync', result.matchState)

      // Check for game end
      if (result.matchState.status === 'finished' && result.matchState.winner) {
        const resultKey = `${matchId}:${result.matchState.winner}`
        if (!emittedResults.has(resultKey)) {
          emittedResults.add(resultKey)
          gameNamespace.to(roomId).emit('result', {
            winner: result.matchState.winner,
            winningLine: result.matchState.winningLine || null
          })
        }
      }
    } else {
      socket.emit('claimRejected', { reason: result.reason })
    }
  })

  // Request rematch
  socket.on('requestRematch', ({ matchId }) => {
    matchService.requestRematch({ matchId, playerId: socket.id })
    const roomId = GameRegistry.getRoomIdByMatchId(matchId)
    if (!roomId) return

    const oldMatch = matchService.getMatch(matchId)
    if (!oldMatch) return

    gameNamespace.to(roomId).emit('rematchRequested', {
      playerId: socket.id,
      seat: oldMatch.playerSeats.get(socket.id)
    })

    // Check if both requested
    const newMatchId = matchService.checkRematchReady(matchId)
    if (newMatchId) {
      const newMatch = matchService.getMatch(newMatchId)
      if (newMatch) {
        gameNamespace.to(roomId).emit('matchStarted', {
          matchId: newMatchId,
          matchState: newMatch,
          playerSeats: Object.fromEntries(newMatch.playerSeats)
        })
      }
    }
  })

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
    roomManager.handleDisconnect(socket.id)
  })
})

// Start server
fastify.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`✅ Server listening on ${address}`)
  console.log(`✅ Socket.IO namespace: ${NAMESPACE}`)
  console.log(`✅ Match mode: ${MATCH_MODE}`)
})
