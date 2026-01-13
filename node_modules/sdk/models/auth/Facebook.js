/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const request = require('request');

const AFError = require('../Error.js');

class Facebook {
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
    return new Promise((resolve, reject) => {
      /*let token = 'EAAD4NjyqR9EBALCXrDS6bnZB8ZCb4HB2BKTeooW9ELv2GL1oWLZBN0mL2yQpK2VpTveE0v8aY' +
                'pu5VGTjLOZC6e8v1JHjpelUpQLsSZCaLDuzrZC4mXjXlZCpNuVFp5wU0qZBKbCS6q5XQ1g1N1A' +
                '4fQsb3B73vSEAV6JS3b9cyZAwDdFL4SoAJtDPZCy0JsJvrZBZCXv5eU0h4REwmQZDZD';*/

      request({
        url: 'https://graph.facebook.com/me?access_token=' + token,
        method: 'GET'
      }, (err, res, body) => {

        let data = JSON.parse(body);

        if (data.id) {
          resolve(data);
        } else {
          reject(new AFError(401, 'Invalid facebook token'));
        }
      });

    });
  }
}

module.exports = Facebook;
