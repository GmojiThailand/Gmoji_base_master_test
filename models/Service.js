'use strict';

const SDKService = require('sdk').Service;

class Service extends SDKService {
  constructor(...args) {
    super(...args);
  }

  static fetch(...args) {
    return super.fetch(...args);
  }

  static request(...args) {
    return super.request(...args);
  }
}

module.exports = Service;
