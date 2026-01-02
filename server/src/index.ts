import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifySocketIO from 'fastify-socket.io'
import { Socket } from 'socket.io'
import { RoomManager } from './services/roomManager.js'
import { MatchService } from './services/matchService.js'
import { GameRegistry } from './services/gameRegistry.js'
import { ClientToServerEvents, ServerToClientEvents, Player } from './types/room.js'
import { logger } from './utils/logger.js'

// Game of Strife Mobile Backend
logger.info('='.repeat(50))
logger.info('Game of Strife - Mobile Backend')
logger.info('ENGINE: Game of Strife (hardcoded)')
logger.info('='.repeat(50))

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
  logger.connection('connect', socket.id)

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
    logger.room('create', room.code, socket.id)
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
        // Emit matchStart to each player individually with their seat assignment
        room.players.forEach((player, index) => {
          const seat = index === 0 ? 'P1' : 'P2'
          const playerSocket = gameNamespace.sockets.get(player.socketId!)

          if (playerSocket) {
            playerSocket.emit('matchStart', {
              matchId: matchState.id,
              roomId: room.id,
              players: room.players,
              startedAt: new Date(),
              mySeat: seat,
              board: matchState.board,
              currentTurn: matchState.currentTurn,
              gameType: matchState.gameType,
              version: matchState.version,
              status: matchState.status,
              metadata: matchState.metadata || {
                generation: 0,
                playerTokens: (matchState.engineState as any)?.playerTokens,
                boardSize: (matchState.engineState as any)?.boardSize,
                conwayRules: (matchState.engineState as any)?.conwayRules,
                stage: (matchState.engineState as any)?.currentPhase,
                settings: matchState.gameSettings,
                fullBoard: (matchState.engineState as any)?.board,
                player0Superpowers: (matchState.engineState as any)?.player0Superpowers,
                player1Superpowers: (matchState.engineState as any)?.player1Superpowers
              }
            })
          }
        })

        logger.match('start', matchState.id, { room: room.code })
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

  // Get all waiting rooms (user's own + public rooms)
  socket.on('getAllWaitingRooms', () => {
    const rooms = roomManager.getAllWaitingRooms(socket.id)
    const roomData = rooms.map(r => ({
      id: r.id,
      code: r.code,
      status: r.status,
      players: r.players.map(p => ({ id: p.id, joinedAt: p.joinedAt, isReady: p.isReady })),
      maxPlayers: r.maxPlayers,
      createdAt: r.createdAt,
      lastActivity: r.lastActivity,
      isPublic: r.isPublic,
      gameSettings: r.gameSettings,
      isOwnRoom: r.players.some(p => p.id === socket.id)
    }))
    socket.emit('allWaitingRooms', roomData)
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

      logger.room('leave', room.code, socket.id)
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
      // Send full board with metadata for Game of Strife
      const fullBoardData: any = {
        matchId,
        squareId,
        by: socket.id,
        version: result.matchState.version,
        nextTurn: result.matchState.currentTurn,
        board: result.matchState.board, // Flat board for compatibility
      }

      // For Game of Strife, include full 2D board and metadata
      if (result.matchState.gameType === 'gameofstrife' && result.matchState.engineState) {
        fullBoardData.metadata = {
          fullBoard: (result.matchState.engineState as any).board, // 2D Cell[][] array
          generation: (result.matchState.engineState as any).generation,
          playerTokens: (result.matchState.engineState as any).playerTokens,
          boardSize: (result.matchState.engineState as any).boardSize,
          stage: (result.matchState.engineState as any).currentPhase,
          conwayRules: (result.matchState.engineState as any).conwayRules,
          settings: result.matchState.gameSettings,
          player0Superpowers: (result.matchState.engineState as any).player0Superpowers,
          player1Superpowers: (result.matchState.engineState as any).player1Superpowers
        }
      }

      gameNamespace.to(roomId).emit('squareClaimed', fullBoardData)

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
      // Emit matchStart to each player individually with their seat assignment
      room.players.forEach((player, index) => {
        const seat = index === 0 ? 'P1' : 'P2'
        const playerSocket = gameNamespace.sockets.get(player.socketId!)

        if (playerSocket) {
          playerSocket.emit('matchStart', {
            matchId: newMatch.id,
            roomId: room.id,
            players: room.players,
            startedAt: new Date(),
            mySeat: seat,
            board: newMatch.board,
            currentTurn: newMatch.currentTurn,
            gameType: newMatch.gameType,
            version: newMatch.version,
            status: newMatch.status,
            metadata: newMatch.metadata || {
              generation: 0,
              playerTokens: (newMatch.engineState as any)?.playerTokens,
              boardSize: (newMatch.engineState as any)?.boardSize,
              conwayRules: (newMatch.engineState as any)?.conwayRules,
              stage: (newMatch.engineState as any)?.currentPhase,
              settings: newMatch.gameSettings,
              fullBoard: (newMatch.engineState as any)?.board,
              player0Superpowers: (newMatch.engineState as any)?.player0Superpowers,
              player1Superpowers: (newMatch.engineState as any)?.player1Superpowers
            }
          })
        }
      })

      logger.match('rematch', newMatch.id, { room: room.code })
    }
  })

  // Ping/Pong
  socket.on('ping', () => {
    socket.emit('pong')
  })

  // Disconnect
  socket.on('disconnect', () => {
    logger.connection('disconnect', socket.id)
    roomManager.leaveRoom(socket.id)
  })
})

// Start server
fastify.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    logger.error('Failed to start server', { error: err.message })
    process.exit(1)
  }
  logger.info(`Server listening on ${address}`)
  logger.info(`Socket.IO namespace: ${NAMESPACE}`)
  logger.info(`Match mode: ${MATCH_MODE}`)
})
