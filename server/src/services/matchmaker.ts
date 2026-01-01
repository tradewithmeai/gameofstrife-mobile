import { Mutex } from 'async-mutex'
import { v4 as uuidv4 } from 'uuid'
import { Room } from '../types/room.js'
import { logger } from '../utils/logger.js'

interface MatchRequest {
  playerId: string
  socketId: string
  timestamp: Date
  correlationId: string
}

interface PairingResult {
  type: 'paired' | 'queued'
  room?: Room
  correlationId: string
}

export class Matchmaker {
  private queue: MatchRequest[] = []
  private mutex = new Mutex()
  private rooms = new Map<string, Room>()
  private playerRooms = new Map<string, string>()
  private watchdogs = new Map<string, NodeJS.Timeout>()

  async requestQuickMatch(playerId: string, socketId: string): Promise<PairingResult> {
    const correlationId = uuidv4()
    logger.debug('QuickMatch request', { playerId, correlationId, queueLen: this.queue.length })

    return await this.mutex.runExclusive(async () => {
      // Remove player from any existing room first
      this.removeFromExistingRoom(playerId)

      // Check if player is already in queue (prevent duplicates)
      const existingIndex = this.queue.findIndex(req => req.playerId === playerId)
      if (existingIndex !== -1) {
        logger.debug('QuickMatch queue updated', { playerId, correlationId })
        this.queue[existingIndex] = {
          playerId,
          socketId,
          timestamp: new Date(),
          correlationId
        }
      } else {
        // Add to queue
        this.queue.push({
          playerId,
          socketId,
          timestamp: new Date(),
          correlationId
        })
      }

      // Try to pair players
      if (this.queue.length >= 2) {
        const [player1, player2] = this.queue.splice(0, 2)

        logger.debug('QuickMatch pairing', { player1: player1.playerId, player2: player2.playerId })

        // Create room
        const room = this.createRoom(player1, player2)

        // Mark both players as in this room
        this.playerRooms.set(player1.playerId, room.id)
        this.playerRooms.set(player2.playerId, room.id)

        logger.info('QuickMatch room created', { roomCode: room.code, correlationId })

        return {
          type: 'paired',
          room,
          correlationId
        }
      }

      logger.debug('QuickMatch queued', { playerId, correlationId, queueLen: this.queue.length })

      return {
        type: 'queued',
        correlationId
      }
    })
  }

  async removeFromQueue(playerId: string): Promise<void> {
    await this.mutex.runExclusive(async () => {
      const beforeLen = this.queue.length
      this.queue = this.queue.filter(req => req.playerId !== playerId)
      
      if (beforeLen !== this.queue.length) {
        logger.debug('QuickMatch removed from queue', { playerId, queueLen: this.queue.length })
      }
    })
  }

  private removeFromExistingRoom(playerId: string): void {
    const existingRoomId = this.playerRooms.get(playerId)
    if (existingRoomId) {
      const room = this.rooms.get(existingRoomId)
      if (room) {
        room.players = room.players.filter(p => p.id !== playerId)
        if (room.players.length === 0 && room.status === 'waiting') {
          this.rooms.delete(existingRoomId)
          logger.debug('QuickMatch empty room removed', { roomId: existingRoomId })
        }
      }
      this.playerRooms.delete(playerId)
    }
  }

  private createRoom(player1: MatchRequest, player2: MatchRequest): Room {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const roomCode = this.generateRoomCode()

    const room: Room = {
      id: roomId,
      code: roomCode,
      status: 'active', // Auto-start when two players matched
      players: [
        {
          id: player1.playerId,
          socketId: player1.socketId,
          isReady: true,
          joinedAt: new Date()
        },
        {
          id: player2.playerId,
          socketId: player2.socketId,
          isReady: true,
          joinedAt: new Date()
        }
      ],
      maxPlayers: 2,
      createdAt: new Date(),
      lastActivity: new Date(),
      matchStartedAt: new Date(),
      isPublic: false
    }

    this.rooms.set(roomId, room)
    return room
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const prefix = 'ROOM-'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return prefix + code
  }

  startWatchdog(roomId: string, callback: () => void): void {
    if (this.watchdogs.has(roomId)) {
      clearTimeout(this.watchdogs.get(roomId)!)
    }
    
    const timeout = setTimeout(() => {
      logger.debug('QuickMatch watchdog triggered', { roomId })
      callback()
      this.watchdogs.delete(roomId)
    }, 2000)

    this.watchdogs.set(roomId, timeout)
  }

  clearWatchdog(roomId: string): void {
    const timeout = this.watchdogs.get(roomId)
    if (timeout) {
      clearTimeout(timeout)
      this.watchdogs.delete(roomId)
    }
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId)
  }

  // Debug methods
  getQueueStatus(): { length: number; headSample: string[] } {
    return {
      length: this.queue.length,
      headSample: this.queue.slice(0, 5).map(req => req.playerId)
    }
  }

  getRoomsStatus(): { waiting: number; active: number; sampleIds: string[] } {
    const rooms = Array.from(this.rooms.values())
    return {
      waiting: rooms.filter(r => r.status === 'waiting').length,
      active: rooms.filter(r => r.status === 'active').length,
      sampleIds: rooms.slice(0, 5).map(r => r.id)
    }
  }

  destroy(): void {
    // Clear all watchdogs
    this.watchdogs.forEach(timeout => clearTimeout(timeout))
    this.watchdogs.clear()
  }
}