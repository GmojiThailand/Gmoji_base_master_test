'use strict';

const SDKRole = require('sdk').Role;

class Role extends SDKRole {
  constructor(...args) {
    super(...args);
  }

  static find(...args) {
    return super.find(...args);
  }

  static findAll(...args) {
    return super.findAll(...args);
  }

  static access(...args) {
    return super.access(...args);
  }

  static validatePermission(...args) {
    return super.validatePermission(...args);
  }
}

module.exports = Role;
