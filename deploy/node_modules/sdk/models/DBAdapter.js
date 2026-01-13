/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const Config = require('./Config')();

const adapters = {
  mongodb: require('../DBAdapters/MongoDB'),
  MongoDB: require('../DBAdapters/MongoDB'),
};

function get(name = Config.adapter) {
  return adapters[name];
}

module.exports.get = get;
module.exports.list = Object.keys(adapters);
