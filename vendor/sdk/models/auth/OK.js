/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const md5 = require('md5');
const co = require('co');
const request = require('request');

const AFError = require('../Error.js');

class OK {
  constructor(options) {
    this.options = options;
  }

  setReq(req) { this.req = req; return this;}

  login() {
    if (!this.req.request.fields.token) {
      return Promise.reject();
    }

    return this.checkToken(this.req.request.fields.token);
  }

  auth() {
    let token = this.req.headers.authorization;
    if (!token) {
      return Promise.reject();
    }

    return this.checkToken(token);
  }

  logout() {
    return Promise.resolve();
  }

  checkToken(token) {
    return co(function *() {
      /*let token = '3cc5a3908031bb1786b20e49aec187efc27b45d49fa4720a9dba5a0b.c7';*/

      let { application_key, application_secret_key } = this.options || {};
      if (!application_key || !application_secret_key) throw new AFError(500, 'Invalid OK config.');

      let str = `${token}${application_secret_key}`;
      let secret_key = md5(`${token}${application_secret_key}`);
      let str2 = `application_key=${application_key}format=jsonmethod=users.getCurrentUser${secret_key}`;
      let sig = md5(`application_key=${application_key}format=jsonmethod=users.getCurrentUser${secret_key}`)

      let { uid, error_msg } = yield this.checkRequest({ token, application_key, sig });
      if (!uid) throw new AFError(500, error_msg || 'Invalid OK response.');

      return { id: uid};
    }.bind(this));
  }

  checkRequest({ token, application_key, sig } = {}) {
    let check_url = `https://api.ok.ru/fb.do?application_key=${application_key}&format=json&method=users.getCurrentUser&sig=${sig}&access_token=${token}`;

    return new Promise((resolve, reject) => request(check_url, (err, res, body) => err ? reject(err) : resolve(JSON.parse(body))))
      .catch(err => Promise.reject(new AFError(400, 'Invalid OK token.')));
  }
}

module.exports = OK;
