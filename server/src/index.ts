import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifySocketIO from 'fastify-socket.io'
import { Socket } from 'socket.io'
import { RoomManager } from './services/roomManager.js'
import { MatchService } from './services/matchService.js'
import { GameRegistry } from './services/gameRegistry.js'
import { ClientToServerEvents, ServerToClientEvents, Player } from './types/room.js'

// Game of Strife Mobile Backend
console.log('='.repeat(50))
console.log('Game of Strife - Mobile Backend')
console.log('ENGINE: Game of Strife (hardcoded)')
console.log('='.repeat(50))

// Single namespace constant
export const NAMESPACE = '/game'

// Create global service instances
const roomManager = new RoomManager()
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

  socket.emit('welcome', 'Connected to Game of Strife')

  // Create room
  socket.on('createRoom', ({ isPublic, settings }) => {
    const room = roomManager.createRoom(socket.id, socket.id, isPublic, settings)
    socket.join(room.id)
    socket.emit('roomJoined', {
      id: room.id,
      code: room.code,
      status: room.status,
      players: room.players.map(p => ({ id: p.id, joinedAt: p.joinedAt, isReady: p.isReady })),
      maxPlayers: room.maxPlayers,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity,
      isPublic: room.isPublic,
      gameSettings: room.gameSettings
    })
    console.log(`Room created: ${room.code} by ${socket.id}`)
  })

  // Join room
  socket.on('joinRoom', (code: string) => {
    const room = roomManager.joinRoom(socket.id, socket.id, code)
    if (!room) {
      socket.emit('error', 'Room not found or full')
      return
    }

    socket.join(room.id)
    const roomData = {
      id: room.id,
      code: room.code,
      status: room.status,
      players: room.players.map(p => ({ id: p.id, joinedAt: p.joinedAt, isReady: p.isReady })),
      maxPlayers: room.maxPlayers,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity,
      isPublic: room.isPublic,
      gameSettings: room.gameSettings
    }

    socket.emit('roomJoined', roomData)
    gameNamespace.to(room.id).emit('roomUpdate', {
      room: roomData,
      type: 'player_joined'
    })

    // Start match when 2 players
    if (room.players.length === 2) {
      const matchState = matchService.createMatch(room.id, room.players.map(p => p.id), room.gameSettings)

      if (matchState) {
        gameNamespace.to(room.id).emit('matchStart', {
          roomId: room.id,
          players: room.players,
          startedAt: new Date()
        })
      }
    }
  })

  // Get public rooms
  socket.on('getPublicRooms', () => {
    const rooms = roomManager.getPublicRooms()
    const roomData = rooms.map(r => ({
      id: r.id,
      code: r.code,
      status: r.status,
      players: r.players.map(p => ({ id: p.id, joinedAt: p.joinedAt, isReady: p.isReady })),
      maxPlayers: r.maxPlayers,
      createdAt: r.createdAt,
      lastActivity: r.lastActivity,
      isPublic: r.isPublic,
      gameSettings: r.gameSettings
    }))
    socket.emit('publicRooms', roomData)
  })

  // Leave room
  socket.on('leaveRoom', () => {
    const room = roomManager.leaveRoom(socket.id)

    // Leave the socket.io room channel
    if (room) {
      socket.leave(room.id)

      // Notify remaining players in the room
      const roomData = {
        id: room.id,
        code: room.code,
        status: room.status,
        players: room.players.map(p => ({ id: p.id, joinedAt: p.joinedAt, isReady: p.isReady })),
        maxPlayers: room.maxPlayers,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity,
        isPublic: room.isPublic,
        gameSettings: room.gameSettings
      }

      gameNamespace.to(room.id).emit('roomUpdate', {
        room: roomData,
        type: 'player_left'
      })

      console.log(`Player ${socket.id} left room ${room.code}`)
    }

    // Confirm to the leaving player
    socket.emit('roomLeft')
  })

  // Claim square
  socket.on('claimSquare', async ({ matchId, squareId, selectionId, superpowerType }) => {
    const result = await matchService.claimSquare({
      matchId,
      squareId,
      selectionId,
      playerId: socket.id,
      superpowerType
    })

    const roomId = GameRegistry.getRoomIdForMatch(matchId)
    if (!roomId) return

    if (result.success && result.matchState) {
      gameNamespace.to(roomId).emit('squareClaimed', {
        matchId,
        move: { squareId, playerId: socket.id, superpowerType },
        matchState: result.matchState,
        version: result.matchState.version
      })

      // Check for game end
      if (result.matchState.status === 'finished' && result.matchState.winner) {
        const resultKey = `${matchId}:${result.matchState.winner}`
        if (!emittedResults.has(resultKey)) {
          emittedResults.add(resultKey)
          gameNamespace.to(roomId).emit('gameResult', {
            matchId,
            winner: result.matchState.winner,
            winningLine: result.matchState.winningLine || null
          })
        }
      }
    } else {
      socket.emit('claimRejected', {
        matchId,
        squareId,
        reason: result.reason || 'Unknown error',
        selectionId
      })
    }
  })

  // Request rematch
  socket.on('rematch', async ({ matchId }) => {
    const roomId = GameRegistry.getRoomIdForMatch(matchId)
    if (!roomId) return

    const room = roomManager.getRoom(roomId)
    if (!room || room.players.length !== 2) return

    // Create new match
    const newMatch = matchService.createMatch(roomId, room.players.map((p: Player) => p.id), room.gameSettings)

    if (newMatch) {
      gameNamespace.to(roomId).emit('matchStart', {
        roomId: room.id,
        players: room.players,
        startedAt: new Date()
      })
    }
  })

  // Ping/Pong
  socket.on('ping', () => {
    socket.emit('pong')
  })

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
    roomManager.leaveRoom(socket.id)
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
