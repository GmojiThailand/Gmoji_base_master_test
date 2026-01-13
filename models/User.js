'use strict';

const SDKUser = require('sdk').User;

class User extends SDKUser {
  constructor(...args) {
    super(...args);
  }

  static find(...args) {
    return super.find(...args);
  }

  static findAll(...args) {
    return super.findAll(...args);
  }

  static save(...args) {
    return super.save(...args);
  }

  static update(...args) {
    return super.update(...args);
  }

  static remove(...args) {
    return super.remove(...args);
  }
}

module.exports = User;
