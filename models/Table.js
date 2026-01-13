'use strict';

const SDKTable = require('sdk').Table;

class Table extends SDKTable {
  constructor(...args) {
    super(...args);
  }

  static fetch(...args) {
    return super.fetch(...args);
  }

  static find(...args) {
    return super.find(...args);
  }

  static findAll(...args) {
    return super.findAll(...args);
  }

  static findOneAndUpdate(...args) {
    return super.findOneAndUpdate(...args);
  }

  static create(...args) {
    return super.create(...args);
  }

  static update(...args) {
    return super.update(...args);
  }

  static remove(...args) {
    return super.remove(...args);
  }
}

module.exports = Table;
