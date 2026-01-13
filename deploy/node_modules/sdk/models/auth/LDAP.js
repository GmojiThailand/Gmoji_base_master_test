/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const ldapjs = require('ldapjs');
const co = require('co');

const AFError = require('../Error');
const User = require('../User');

class LDAP {
  constructor(options) {
    this.options = options;
    this.req = {};
  }

  setReq(req) { this.req = req; return this; }

  _connect() {
    return this.connecting || (this.connecting = new Promise((resolve, reject) => {
      let checkConnect = () => (this.ldapClient.connected ? resolve() : setImmediate(checkConnect));
      checkConnect();
      this.ldapClient.on('error', reject);
    }));
  }

  connect() {
    return co(function *() {
      this.ldapClient = this.ldapClient || ldapjs.createClient({
        url: this.generateLdapUrl(this.options)
      });

      try {
        yield this._connect();
      } catch (e) {
        throw new AFError(500, 'Error on LDAP server:' + e.message);
      }

      this.connected = true;
    }.bind(this));
  }

  login() {
    var opts = {
      filter: '(uid=' + this.req.body.username + ')',
      scope: 'sub',
      attributes: []
    };

    return co(function *() {
      yield this.connect();
      yield this.bindP(['', '']);
      let entry = yield this.searchP([this.options.dn, opts]);
      yield this.bindP(['cn=' + entry.object.cn + ',' + this.options.dn, this.req.body.password]);
      return entry;
    }.bind(this));
  }

  auth() {
    var userData = {};
    var token = this.req.headers.authorization;

    if (token) {
      credentials = new Buffer(token.replace(/basic /i, ''), 'base64').toString().split(':');
      userData.username = credentials[0];
      userData.password = credentials[1];
    } else {
      if (this.req.query && this.req.query.username) {
        userData = this.req.query;
      }

      if (this.req.request && this.req.request.fields) {
        this.req.body = this.req.request.fields;
      }
      if (this.req.body && this.req.body.username) {
        userData = this.req.body;
      }
    }
  }

  logout() {
    return Promise.resolve();
  }

  generateLdapUrl(data) {
    return 'ldap://' + data.host + ':' + data.port + '/dc=' + data.domain;
  }

  bindP(params) {
    return new Promise((resolve, reject) => {
      this.ldapClient.bind(params[0], params[1], (err) => {
        if (err) {
          this.ldapClient.unbind();

          return reject(err);
        }

        resolve();
      });
    });
  }

  searchP(params) {
    return new Promise((resolve, reject) => {
      this.ldapClient.search(params[0], params[1], (err, search) => {
        if (err) { return reject(err); }

        var found = false;

        search.on('end', (result) => {
          if (!found) { reject(new AFError(404, 'User not found')); }
        });

        search.on('searchEntry', (entry) => {
          found = true;

          resolve(entry);
        });
      });
    });
  }
}

module.exports = LDAP;
