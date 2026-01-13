/*
 * Copyright (c) E-System LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Written by E-System team (https://ext-system.com), 2020
 */

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
