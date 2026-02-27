// // config/logger.js
// const { createLogger, format, transports } = require("winston");

// const logger = createLogger({
//   level: "info",
//   format: format.combine(
//     format.colorize(), // 🎨 adds colors
//     format.timestamp({ format: "HH:mm:ss" }),
//     format.printf(({ level, message, timestamp }) => {
//       return `[${timestamp}] ${level}: ${message}`;
//     })
//   ),
//   transports: [new transports.Console()],
// });

// module.exports = logger;


// config/logger.js
const { createLogger, format, transports } = require("winston");

// Function to color status codes
const statusColor = (status) => {
  if (status >= 500) return `\x1b[31m${status}\x1b[0m`; // Red
  if (status >= 400) return `\x1b[33m${status}\x1b[0m`; // Yellow
  if (status >= 300) return `\x1b[36m${status}\x1b[0m`; // Cyan
  return `\x1b[32m${status}\x1b[0m`; // Green
};

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.colorize({ all: true }),
    format.timestamp({ format: "HH:mm:ss" }),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports: [new transports.Console()],
});

module.exports = { logger, statusColor };
