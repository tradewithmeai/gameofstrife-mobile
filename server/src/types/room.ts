export type RoomStatus = 'waiting' | 'active' | 'finished'

export interface Player {
  id: string // socket.id
  socketId: string
  joinedAt: Date
  isReady: boolean
}

export interface Room {
  id: string
  code: string // human-readable code like "ROOM-ABC123"
  status: RoomStatus
  players: Player[]
  maxPlayers: number
  createdAt: Date
  lastActivity: Date
  matchStartedAt?: Date
  isPublic: boolean
  gameSettings?: any  // Game-specific settings (e.g., GameOfStrifeSettings)
  creatorOccupied?: boolean  // true when creator is in a different match
}

export interface Match {
  roomId: string
  players: Player[]
  startedAt: Date
}

export interface RoomUpdate {
  room: Omit<Room, 'players'> & { players: Omit<Player, 'socketId'>[]; gameSettings?: any; creatorOccupied?: boolean }
  type: 'player_joined' | 'player_left' | 'status_changed' | 'match_start'
}

export interface QuickMatchRequest {
  playerId: string
  socketId: string
}

// Socket event types
export interface ServerToClientEvents {
  roomUpdate: (update: RoomUpdate) => void
  matchStart: (match: Match) => void
  roomJoined: (room: RoomUpdate['room']) => void
  roomLeft: () => void
  error: (message: string) => void
  quickMatchFound: (room: RoomUpdate['room']) => void
  publicRooms: (rooms: RoomUpdate['room'][]) => void
  welcome: (message: string) => void
  pong: () => void
  squareClaimed: (data: { matchId: string; move: any; matchState: any; version: number }) => void
  claimRejected: (data: { matchId: string; squareId: number; reason: string; selectionId: string }) => void
  gameResult: (data: { matchId: string; winner: string | null; winningLine: number[] | null }) => void
}

export interface ClientToServerEvents {
  quickMatch: () => void
  createRoom: (data: { isPublic: boolean; settings?: any }) => void
  joinRoom: (code: string) => void
  leaveRoom: () => void
  getPublicRooms: () => void
  playerReady: (ready: boolean) => void
  ping: () => void
  claimSquare: (data: { matchId: string; squareId: number; selectionId: string; superpowerType?: number }) => void
  rematch: (data: { matchId: string }) => void
}