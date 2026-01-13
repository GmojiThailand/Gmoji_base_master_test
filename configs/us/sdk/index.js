'use strict';

let config = null;

module.exports = (env = process.env.NODE_ENV) => {
  if (config) {
    return config;
  }

  env = env || 'develop';
  config = require(`./${env}`);
  config.env = env;

  return config;
};
