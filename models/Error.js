'use strict';

const SDKError = require('sdk').Error;

class _Error extends SDKError {
  constructor(...args) {
    super(...args);
    this.expose = true;
  }
}

module.exports = _Error;
