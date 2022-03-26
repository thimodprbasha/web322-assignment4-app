var appRoot = require("app-root-path");
const { createLogger, format, transports } = require("winston");
const { combine, splat, timestamp, printf, prettyPrint } = format;

const Format = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message} `;
  if (metadata) {
    msg += JSON.stringify(metadata);
  }
  return msg;
});

// define the custom settings for each transport (file, console)
var options = {
  file: {
    level: "info",
    filename: `${appRoot}/logs/app.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  console: {
    level: "debug",
    handleExceptions: true,
    // json: true,
    // colorize: true,
    format: combine(format.colorize(), splat(), timestamp(), Format),
    // format: ,
  },
};

// instantiate a new Winston Logger with the settings defined above
var logger = createLogger({
  transports: [
    new transports.File(options.file),
    new transports.Console(options.console),
  ],
  exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: function (message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    // logger.info(message);
  },
};

// console.log = function () {
//   return logger.info.apply(logger, arguments);
// };
// console.error = function () {
//   return logger.error.apply(logger, arguments);
// };
// console.info = function () {
//   return logger.warn.apply(logger, arguments);
// };

module.exports = logger;
