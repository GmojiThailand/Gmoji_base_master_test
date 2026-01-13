/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const config = {
  name: 'api-factory',
  adapter: 'mongodb',
  oauth: {
    accessTokenLifetime: 60 * 60 * 24,
    refreshTokenLifetime: 60 * 60 * 24 * 7,
  },
  db: {},
  environment: {},
  filestorage: {
    root: __dirname + '/../../../',
    location: 'files/',
  },
};

function defaultMongoDB() {
  return {
    host: 'localhost',
    name: config.name.trim().replace(/\s+/gi, '_'),
    username: 'api-factory',
    password: 'MinerVA20022016',
    authSource: 'api-factory',
  };
};

function configure(options = {}) {
  config.name = options.name || config.name;
  config.adapter = options.adapter || config.adapter;
  config.oauth = options.oauth || config.oauth;
  config.db = options.db || config.db;
  config.environment = options.environment || config.environment;
  config.filestorage = options.filestorage || config.filestorage;

  if (config.adapter == 'mongodb' && !config.db.mongodb) {
    config.db.mongodb = defaultMongoDB();
  }

  if (!config.db[config.adapter]) {
    throw new Error('Указан адаптер \'' + config.adapter + '\' но не указаны настройки для подключения.');
  }
}

module.exports = () => config;
module.exports.configure = configure;
