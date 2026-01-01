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

/**
 * Write to log file
 */
const writeToFile = async (message: string) => {
  if (!DEV_MODE) return;

  try {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1); // Just time part
    const logLine = `[${timestamp}] ${message}\n`;

    // Add to buffer
    logBuffer.push(logLine);
    if (logBuffer.length > MAX_BUFFER_SIZE) {
      logBuffer.shift();
    }

    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(LOG_FILE_PATH);

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
 * Initialize logging - call this at app start
 */
export const initLogging = async () => {
  if (!DEV_MODE) return;

  try {
    // Clear old logs on init
    await clearLogs();
    console.log('📝 File logging initialized:', LOG_FILE_PATH);
    console.log('💡 Verbose logs are saved to file. Use getLogs() to view.');
  } catch (error) {
    console.error('Failed to initialize logging:', error);
  }
};
