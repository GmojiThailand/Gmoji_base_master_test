/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const Config = require('./Config')();

const adaptersList = ['mongodb', 'json', 'api'];

const adapters = {
  get mongodb() { return require('../Adapters/MongoDB'); },
};

function get(name = Config.adapter) {
  return adapters[name.toLowerCase()] || adapters[Config.adapter.toLowerCase()];
}

module.exports.get = get;
module.exports.list = adaptersList;
