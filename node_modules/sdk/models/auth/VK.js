/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const co = require('co');
const request = require('request');

const AFError = require('../Error.js');

class VK {
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
      /*let token = '0b5f2f67649017a70453a92927b4003b9dfb84482c3dda6d234d5a31358a1850e401a6ad5def3aee32dd5';*/

      let { client_id, client_secret } = this.options || {};

      let { access_token } = yield this.accessRequest({ client_id, client_secret });
      let { user_id } = yield this.checkRequest({ token, access_token, client_secret });

      return { id: user_id};
    }.bind(this));
  }

  accessRequest({ client_id, client_secret } = {}) {
    if (!client_id || !client_secret) throw new AFError(500, 'Invalid VK config.');

    let access_url = `https://oauth.vk.com/access_token?v=5.60&client_id=${client_id}&client_secret=${client_secret}&grant_type=client_credentials`;

    return new Promise((resolve, reject) => request(access_url, (err, res, body) => err ? reject(err) : resolve(JSON.parse(body) || {})))
      .catch(err => Promise.reject(new AFError(500, 'Invalid VK config.')));
  }

  checkRequest({ token, access_token, client_secret } = {}) {
    if (!access_token) throw new AFError(400, 'No access_token.');

    let check_url = `https://api.vk.com/method/secure.checkToken?v=5.60&access_token=${access_token}&client_secret=${client_secret}&token=${token}`;

    return new Promise((resolve, reject) => request(check_url, (err, res, body) => err ? reject(err) : resolve(JSON.parse(body).response || {})))
      .catch(err => Promise.reject(new AFError(400, 'Invalid VK token.')));
  }
}

module.exports = VK;
