/**
 * Efficient logger with configurable log levels
 * Set LOG_LEVEL environment variable to control verbosity:
 * - ERROR: Only errors
 * - WARN: Warnings and errors
 * - INFO: Info, warnings, and errors (default)
 * - DEBUG: All logs including debug info
 * - SILENT: No logs
 */

export enum LogLevel {
  SILENT = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

class Logger {
  private level: LogLevel

  constructor() {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase()
    this.level = LogLevel[envLevel as keyof typeof LogLevel] ?? LogLevel.INFO
  }

  private shouldLog(level: LogLevel): boolean {
    return this.level >= level
  }

  error(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`❌ ${message}`, meta ? JSON.stringify(meta) : '')
    }
  }

  warn(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`⚠️  ${message}`, meta ? JSON.stringify(meta) : '')
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`ℹ️  ${message}`, meta ? JSON.stringify(meta) : '')
    }
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`🔍 ${message}`, meta ? JSON.stringify(meta) : '')
    }
  }

  // Specialized game event logging - concise one-liners
  claim(matchId: string, playerId: string, seat: string, squareId: number, result: 'success' | 'rejected', reason?: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const status = result === 'success' ? '✅' : '❌'
      const reasonStr = reason ? ` (${reason})` : ''
      console.log(`${status} [${matchId.slice(0, 8)}] ${seat} claimed #${squareId}${reasonStr}`)
    }
  }

  match(event: 'start' | 'end' | 'rematch', matchId: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const emoji = event === 'start' ? '🎮' : event === 'end' ? '🏁' : '🔄'
      const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
      console.log(`${emoji} Match ${event}: ${matchId.slice(0, 8)}${metaStr}`)
    }
  }

  room(event: 'create' | 'join' | 'leave' | 'delete', roomCode: string, playerId?: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const playerStr = playerId ? ` (${playerId.slice(0, 8)})` : ''
      console.log(`🚪 Room ${event}: ${roomCode}${playerStr}`)
    }
  }

  connection(event: 'connect' | 'disconnect', socketId: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const emoji = event === 'connect' ? '🔌' : '🔴'
      console.log(`${emoji} Client ${event}: ${socketId.slice(0, 12)}`)
    }
  }
}

export const logger = new Logger()
