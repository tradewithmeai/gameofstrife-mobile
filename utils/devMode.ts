/**
 * Development mode flag for verbose logging
 * Set to false in production to reduce log noise
 */
export const DEV_MODE = __DEV__; // Expo's built-in dev flag

/**
 * Conditional log - only logs in development mode
 */
export const devLog = (...args: any[]) => {
  if (DEV_MODE) {
    console.log(...args);
  }
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
