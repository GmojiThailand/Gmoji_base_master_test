'use strict';

const co = require('co');
const Table = require('./Table');
const User = require('./User');
const HttpError = require('./Error');

class Validator {
  static checkUniquePhone(phone, appid) {
    // делать реквесты по полям профиля тоже
    return co(function* () {
      const usersTable = yield Table.fetch('users', appid);
      const productsTable = yield Table.fetch('products', appid);
      let user = yield usersTable.find({phone}).catch((e) => ({data: null}));
      if (user.data) return false;
      let userSys = yield User.find({username: phone}, {}, appid);
      if (userSys) return false;
      let product = yield productsTable.find({delivery_phone: phone}).catch((e) => ({data: null}));
      if (product.data) return false;
      return true;
    });
  }

  static checkUniqueEmail(email, appid) {
    return co(function* () {
      const usersTable = yield Table.fetch('users', appid);
      const contragentsTable = yield Table.fetch('contragents', appid);
      const subcontragentsTable = yield Table.fetch('subcontragents', appid);
      let userSys = yield User.find({username: email}, {}, appid);
      if (userSys) return false;
      let user = yield usersTable.find({email}).catch((e) => ({data: null}));
      if (user.data) return false;
      let contragent = yield contragentsTable.find({$or: [{email}, {delivery_email: email}]}).catch((e) => ({data: null}));
      if (contragent.data) return false;
      let subcontragent = yield subcontragentsTable.find({email}).catch((e) => ({data: null}));
      if (subcontragent.data) return false;
      return true;
    });
  }

  static buildMongoRegex(string, {included} = options) {
    if (!string) { throw new HttpError(400, 'String required'); }

    string = string
      .replace(/\\/ig, '\\\\')
      .replace(/\./ig, '\\.')
      .replace(/\+/ig, '\\+')
      .replace(/\*/ig, '\\*')
      .replace(/\|/ig, '\\|')
      .replace(/\?/ig, '\\?')
      .replace(/\-/ig, '\\-')
      .replace(/\^/ig, '\\^')
      .replace(/\$/ig, '\\$')
      .replace(/\(/ig, '\\(').replace(/\)/ig, '\\)')
      .replace(/\[/ig, '\\[').replace(/\]/ig, '\\]')
      .replace(/\{/ig, '\\{').replace(/\}/ig, '\\}');

    switch (included) {
      case 'begin':
        string = '^' + string;
        break;

      case 'end':
        string = string + '$';
        break;

      case 'full':
        string = '^' + string + '$';
        break;

      default:
        break;
    }

    let re = new RegExp(string, 'i');

    return re;
  }

  setRequiredFields(fields) {
    this.requiredFields = fields.filter((field) => typeof field == 'string');
  }

  checkRequiredFields(data) {
    this.requiredFields.map((field) => {
      if (data[field] === undefined) {
        throw new HttpError(400, 'Incorrect request fields');
      }
    });
  }
}

module.exports = Validator;
