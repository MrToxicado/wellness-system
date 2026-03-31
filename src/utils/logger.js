const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

const isDev = process.env.NODE_ENV === 'development';

const formatMessage = (level, message, data) => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  ...(data && { data }),
});

const log = (level, message, data) => {
  const entry = formatMessage(level, message, data);
  const style = {
    DEBUG: 'color: #6B7280',
    INFO: 'color: #3B82F6',
    WARN: 'color: #F59E0B',
    ERROR: 'color: #EF4444; font-weight: bold',
  }[level];

  if ((isDev && level !== LOG_LEVELS.DEBUG) || level === LOG_LEVELS.ERROR) {
    console.log(`%c[${entry.timestamp}] [${level}] ${message}`, style, data || '');
  }

  // Store logs in sessionStorage for debugging
  try {
    const logs = JSON.parse(sessionStorage.getItem('app_logs') || '[]');
    logs.push(entry);
    if (logs.length > 500) logs.shift(); // keep last 500
    sessionStorage.setItem('app_logs', JSON.stringify(logs));
  } catch {
    // ignore storage errors
  }
};

const logger = {
  debug: (message, data) => log(LOG_LEVELS.DEBUG, message, data),
  info: (message, data) => log(LOG_LEVELS.INFO, message, data),
  warn: (message, data) => log(LOG_LEVELS.WARN, message, data),
  error: (message, data) => log(LOG_LEVELS.ERROR, message, data),

  // Semantic helpers
  bookingCreated: (booking) => log(LOG_LEVELS.INFO, 'Booking created', { bookingId: booking?.id, client: booking?.client_name }),
  bookingUpdated: (bookingId, changes) => log(LOG_LEVELS.INFO, 'Booking updated', { bookingId, changes }),
  bookingCancelled: (bookingId) => log(LOG_LEVELS.INFO, 'Booking cancelled', { bookingId }),
  bookingCheckedIn: (bookingId) => log(LOG_LEVELS.INFO, 'Booking checked in', { bookingId }),
  apiError: (endpoint, error) => log(LOG_LEVELS.ERROR, `API error: ${endpoint}`, { message: error?.message, status: error?.response?.status }),
  userAction: (action, payload) => log(LOG_LEVELS.INFO, `User action: ${action}`, payload),
};

export default logger;
