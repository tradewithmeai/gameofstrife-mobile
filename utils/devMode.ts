import * as FileSystem from 'expo-file-system/legacy';

/**
 * Development mode flag for verbose logging
 * Set to false in production to reduce log noise
 */
export const DEV_MODE = __DEV__; // Expo's built-in dev flag

// Log file path
const LOG_FILE_PATH = `${FileSystem.documentDirectory}game-debug.log`;

// In-memory log buffer (last 100 lines)
let logBuffer: string[] = [];
const MAX_BUFFER_SIZE = 100;
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB max

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
};

// Flag to track if we've intercepted console
let consoleIntercepted = false;

/**
 * Write to log file
 */
const writeToFile = async (message: string) => {
  if (!DEV_MODE) return;

  try {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;

    // Add to buffer
    logBuffer.push(logLine);
    if (logBuffer.length > MAX_BUFFER_SIZE) {
      logBuffer.shift();
    }

    // Check file size before writing
    const fileInfo = await FileSystem.getInfoAsync(LOG_FILE_PATH);

    if (fileInfo.exists && fileInfo.size && fileInfo.size > MAX_LOG_SIZE) {
      // File too large, keep only last 50%
      const content = await FileSystem.readAsStringAsync(LOG_FILE_PATH);
      const lines = content.split('\n');
      const keepLines = Math.floor(lines.length / 2);
      const truncated = lines.slice(-keepLines).join('\n') + '\n';
      await FileSystem.writeAsStringAsync(LOG_FILE_PATH, truncated);
    }

    if (fileInfo.exists) {
      // Append to existing file
      const existingContent = await FileSystem.readAsStringAsync(LOG_FILE_PATH);
      await FileSystem.writeAsStringAsync(LOG_FILE_PATH, existingContent + logLine, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } else {
      // Create new file
      await FileSystem.writeAsStringAsync(LOG_FILE_PATH, logLine, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }
  } catch (error) {
    // Silent fail - don't spam console with file errors
  }
};

/**
 * Format args for logging
 */
const formatArgs = (args: any[]): string => {
  return args
    .map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(' ');
};

/**
 * Create log interceptor for console methods
 */
const createLogInterceptor = (level: string, originalMethod: (...args: any[]) => void) => {
  return (...args: any[]) => {
    // Always show in console
    originalMethod(...args);

    // Also write to file (async, non-blocking)
    const message = `${level}: ${formatArgs(args)}`;
    writeToFile(message).catch(() => {
      // Silent fail
    });
  };
};

/**
 * Clear log file
 */
export const clearLogs = async () => {
  try {
    await FileSystem.deleteAsync(LOG_FILE_PATH, { idempotent: true });
    logBuffer = [];
    console.log('✅ Logs cleared');
  } catch (error) {
    console.error('Failed to clear logs:', error);
  }
};

/**
 * Get log file contents
 */
export const getLogs = async (): Promise<string> => {
  try {
    const exists = await FileSystem.getInfoAsync(LOG_FILE_PATH);
    if (!exists.exists) return 'No logs yet';

    return await FileSystem.readAsStringAsync(LOG_FILE_PATH);
  } catch (error) {
    return `Error reading logs: ${error}`;
  }
};

/**
 * Get recent logs from buffer (immediate, no async)
 */
export const getRecentLogs = (): string => {
  return logBuffer.join('');
};

/**
 * Share/export logs
 */
export const shareLogs = async () => {
  try {
    const { default: Sharing } = await import('expo-sharing');
    const exists = await FileSystem.getInfoAsync(LOG_FILE_PATH);

    if (!exists.exists) {
      console.log('No logs to share');
      return;
    }

    await Sharing.shareAsync(LOG_FILE_PATH);
  } catch (error) {
    console.error('Failed to share logs:', error);
  }
};

/**
 * Minimal console log - only for critical events
 * Everything else goes to file
 */
export const devLog = (...args: any[]) => {
  if (!DEV_MODE) return;

  // Convert to string
  const message = args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');

  // Write to file (async, don't wait)
  writeToFile(message);

  // DON'T log to console - file only
};

/**
 * Console log for critical events only
 */
export const criticalLog = (...args: any[]) => {
  const message = args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');

  console.log(...args);
  writeToFile(`[CRITICAL] ${message}`);
};

/**
 * Always log (for critical info)
 */
export const log = console.log;

/**
 * Summarize large objects for logging
 */
export const summarize = (obj: any, maxDepth = 1): any => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    if (obj.length === 0) return [];
    return `Array(${obj.length})`;
  }

  if (maxDepth === 0) return '{...}';

  const summary: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      summary[key] = `Array(${value.length})`;
    } else if (value && typeof value === 'object') {
      summary[key] = maxDepth > 0 ? summarize(value, maxDepth - 1) : '{...}';
    } else {
      summary[key] = value;
    }
  }
  return summary;
};

/**
 * Get log file info
 */
export const getLogFileInfo = async () => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(LOG_FILE_PATH);
    const size = fileInfo.exists && fileInfo.size ? fileInfo.size : 0;
    return {
      path: LOG_FILE_PATH,
      exists: fileInfo.exists,
      size,
      sizeKB: (size / 1024).toFixed(2) + ' KB',
      sizeMB: (size / 1024 / 1024).toFixed(2) + ' MB',
    };
  } catch (error) {
    return {
      path: LOG_FILE_PATH,
      exists: false,
      size: 0,
      sizeKB: '0 KB',
      sizeMB: '0 MB',
    };
  }
};

/**
 * Initialize logging - call this at app start
 * This intercepts console.log, console.error, console.warn
 */
export const initLogging = async () => {
  if (!DEV_MODE) return;

  try {
    // Clear old logs on init
    await clearLogs();

    // Intercept console methods (only once)
    if (!consoleIntercepted) {
      consoleIntercepted = true;
      console.log = createLogInterceptor('LOG', originalConsole.log);
      console.error = createLogInterceptor('ERROR', originalConsole.error);
      console.warn = createLogInterceptor('WARN', originalConsole.warn);
    }

    originalConsole.log('✅ Logs cleared');
    originalConsole.log('📝 File logging initialized:', LOG_FILE_PATH);
    originalConsole.log('💡 Verbose logs are saved to file. Use getLogs() to view.');
  } catch (error) {
    originalConsole.error('Failed to initialize logging:', error);
  }
};

// Make functions available globally for debugging in console
if (typeof global !== 'undefined') {
  (global as any).getLogs = getLogs;
  (global as any).clearLogs = clearLogs;
  (global as any).getLogFileInfo = getLogFileInfo;
  (global as any).shareLogs = shareLogs;
}
