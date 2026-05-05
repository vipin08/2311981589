const axios = require('axios');

const LOG_API_URL = 'http://20.207.122.201/evaluation-service/logs';
const LOG_LEVELS = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'fatal'
};

async function Log(stack, level, pkg, message) {
  try {
    if (!stack || !level || !pkg || !message) {
      console.error('Invalid log parameters provided');
      return;
    }

    const normalizedLevel = level.toLowerCase();

    if (!['backend', 'frontend'].includes(stack.toLowerCase())) {
      console.error('Stack must be "backend" or "frontend"');
      return;
    }

    if (!Object.values(LOG_LEVELS).includes(normalizedLevel)) {
      console.error('Invalid log level. Use: debug, info, warn, error, fatal');
      return;
    }

    const logPayload = {
      stack: stack.toLowerCase(),
      level: normalizedLevel,
      package: pkg,
      message: message
    };

    const response = await axios.post(LOG_API_URL, logPayload, {
      timeout: 5000
    });

    return response.data;
  } catch (err) {
    console.error(`[${LOG_LEVELS}] [${pkg}] ${message}`, err.message);
  }
}
function loggerMiddleware(req, res, next) {
  const startTime = Date.now();

  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    
    return originalJson.call(this, data);
  };

  next();
}

module.exports = {
  Log,
  loggerMiddleware,
  LOG_LEVELS
};
