'use strict';

const SDKApplication = require('sdk').Application;

class Application extends SDKApplication {
  constructor(...args) {
    super(...args);
  }

  static find(...args) {
    return super.find(...args);
  }
}

module.exports = Application;
