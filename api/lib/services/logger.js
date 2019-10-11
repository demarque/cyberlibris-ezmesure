const winston = require('winston');

module.exports = function logger(loggersConfig) {
  const transports = [];

  for (const key in loggersConfig) {
    if (!loggersConfig[key]) continue;
    transports.push(new (winston.transports[key])(loggersConfig[key]));
  }

  return winston.createLogger({ transports });
};
