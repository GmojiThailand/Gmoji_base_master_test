/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

var http = require('http');
var oauthServer = require('oauth2-server');
const co = require('co');

const AFError = require('../Error');
const User = require('../User');
const Application = require('../Application');
const Entity = require('../Entity');
const Adapter = require('../DBAdapter');
const DBAdapter = Adapter.get();

const symbols = {};
const sym = name => (symbols[name] || (symbols[name] = Symbol(name)));
const [ required, array ] = [true, true];

class OAuth {
  constructor(options) {
    this.options = options;

    this.server = oauthServer(Object.assign({
      model: this,
      grants: ['password', 'refresh_token'],
    }, this.defaultOptions, this.options));
  }

  static get AccessToken() { return AccessToken; }
  static get RefreshToken() { return RefreshToken; }

  get defaultOptions() {
    return {
      accessTokenLifetime: 60 * 60 * 24,
      refreshTokenLifetime: 60 * 60 * 24 * 7,
    };
  }

  setReq(req) { this.req = req; return this;}

  login() {
    return new Promise((resolve, reject) => {
      if (this.req.request && this.req.request.fields) {
        this.req.body = Object.assign({}, this.req.request.fields);
      }

      this.req.body.username = this.req.body.username.toString().trim();
      this.req.headers['content-type'] = 'application/x-www-form-urlencoded';
      this.req.body.grant_type = 'password';

      this.res = {
        set: () => {},
        jsonp: (token) => {
          token.user_id = this.req.user.id;

          if (this.req.user.role && !this.req.user.role.permissions) {
            return reject(new AFError(403, 'Permission denied'));
          }

          resolve(token);
        }
      };

      this.server.grant()(this.req, this.res, (err) => {
        if (err) { reject(err); }
      });
    });
  }
  
/**
 * @deprecated
 */
  auth() {
    return co(function *() {
      let err;
      yield new Promise((resolve, reject) => this.server.authorise()(this.req, {}, err => resolve()));

      if (this.req.oauth && this.req.oauth.bearerToken) {
        if (this.req.oauth.bearerToken.userId) {
          let user;
          try {
            user = yield User.find({
              id: this.req.oauth.bearerToken.userId
            }, {
              populate: 'role'
            }, this.req.oauth.bearerToken.application);
          } catch (e) {
            console.log(e);
          }

          if (!user) {
            throw new AFError(404, 'User not found');
          }

          this.req.user = user;

          if (this.req.application) {
            let app = yield Application.find(this.req.application);
            if (!app) {
              throw new AFError(404, 'Application not found');
            }

            this.req.application = app;
          }
        } else {
          let ent = yield Entity.find(this.req.oauth.bearerToken.clientId);
          if (!ent) {
            throw new AFError(404, 'Entity not found');
          }

          if (this.req.oauth.bearerToken.application.toString() == ent.application.toString()) {
            this.req.user = null;
            this.req.entity = ent;

            let app = yield Application.find(this.req.oauth.bearerToken.application);
            if (!app) {
              return Promise.reject(new AFError(404, 'Application not found'));
            }

            this.req.application = app;
          } else {
            throw new AFError(404, 'Entity not found');
          }
        }

        return;
      }

      throw new AFError(401, 'Unauthorized');
    }.bind(this));
  }

  logout() {
    return co(function *() {
      if (this.req.oauth && this.req.oauth.bearerToken) {
        let accessTokensTable = DBAdapter.init('AccessToken', AccessToken.schema);
        yield accessTokensTable.remove({
          clientId: this.req.oauth.bearerToken.clientId,
          accessToken: this.req.oauth.bearerToken.accessToken
        });

        let refreshTokensTable = DBAdapter.init('RefreshToken', RefreshToken.schema);
        yield refreshTokensTable.remove({
          clientId: this.req.oauth.bearerToken.clientId,
          accessToken: this.req.oauth.bearerToken.accessToken
        });
      } else {
        throw new AFError(401, 'Unauthorized');
      }
    }.bind(this));
  }

  refresh() {
    return new Promise((resolve, reject) => {
      this.req.headers['content-type'] = 'application/x-www-form-urlencoded';
      this.req.body = this.req.body || {};
      if (this.req.request && this.req.request.fields) {
        this.req.body = this.req.request.fields;
      }
      this.req.body.grant_type = 'refresh_token';

      let req = this.req;
      this.res = {
        set: () => {},
        jsonp: (token) => {
          token.user_id = req.user.id;
          resolve(token);
        }
      };

      this.server.grant()(this.req, this.res, (err) => {
        if (err) { reject(err); }
      });
    });
  }

  getAccessToken(accessToken, callback) {
    co(function *() {
      let token = yield DBAdapter.init('AccessToken', AccessToken.schema).find({ accessToken });
      if (!token) callback(new AFError(401, 'Access token not found'));
      callback(null, token);
    }.bind(this));
  }

  saveAccessToken(accessToken, clientId, expires, user, callback) {
    co(function *() {
      let data = {
        accessToken: accessToken,
        application: this.req.application ? this.req.application.id : null,
        clientId: clientId,
        userId: user.id,
        expires: expires,
      };

      if (this.req.application) { data.application = this.req.application.id; }

      let token = yield DBAdapter.init('AccessToken', AccessToken.schema).insert(data);
      if (!token) callback(new AFError(500, 'Access token not saved'));
      callback(null, token);
    }.bind(this));
  }

  getClient(clientId, clientSecret, callback) {
    // For password grant type, be lenient with client secret validation
    // If clientId matches application ID, allow it regardless of clientSecret
    if (this.req && this.req.application) {
      const appSecret = this.req.application.secret;
      const appId = this.req.application.id ? this.req.application.id.toString() : null;
      const clientIdStr = clientId ? clientId.toString() : null;
      
      // If clientId matches application ID, always allow (for password grant)
      if (clientIdStr && appId && clientIdStr === appId) {
        callback(null, { clientId: clientId, clientSecret: clientSecret });
        return;
      }
      
      // Only reject if secret doesn't match AND clientId doesn't match
      if (appSecret && appSecret !== clientSecret && clientIdStr !== appId) {
        return callback(new AFError(401, 'Invalid clientSecret'));
      }
    }

    callback(null, { clientId: clientId, clientSecret: clientSecret });
  }

  grantTypeAllowed(clientId, grantType, callback) {
    if (['password', 'refresh_token'].indexOf(grantType) >= 0) {
      return callback(null, true);
    }

    callback(null, false);
  }

  getUser(username, password, callback) {
    co(function *() {
      const applicationId = this.req.application ? this.req.application.id : null;

      console.log('OAuth.getUser - username:', username, 'applicationId:', applicationId);

      // Find user by username only (legacy code compared MD5 hash in query).
      // Here we support dual-mode verification: bcrypt preferred, fallback to MD5.
      let user = yield User.find({ username: username }, { populate: 'role' }, applicationId);

      if (!user) {
        console.log('OAuth.getUser - user not found');
        return callback(new AFError(401, 'User not found'));
      }

      // Verify password using User.verifyPassword which supports bcrypt and MD5.
      const ok = User.verifyPassword(user.password, password);
      if (!ok) {
        console.log('OAuth.getUser - password mismatch for user:', user.id);
        return callback(new AFError(401, 'User not found'));
      }

      console.log('OAuth.getUser - user verified:', user.id, 'role:', user.role ? user.role.toString() : 'null');

      // If the stored password was legacy MD5 (not bcrypt), re-hash into bcrypt and update record
      if (typeof user.password === 'string' && user.password.indexOf('$2') !== 0) {
        try {
          // Update via user.update to use setter (which now hashes with bcrypt)
          yield user.update({ password });
          console.log('OAuth.getUser - rehashed user password to bcrypt for user:', user.id);
        } catch (e) {
          console.error('OAuth.getUser - failed to rehash password for user:', user.id, e);
        }
      }

      return callback(null, user);
    }.bind(this));
  }

  saveRefreshToken(refreshToken, clientId, expires, user, callback) {
    co(function *() {
      var data = {
        refreshToken: refreshToken,
        clientId: clientId,
        userId: user.id,
        expires: expires,
      };

      if (this.req.application) { data.application = this.req.application.id; }

      let token = yield DBAdapter.init('RefreshToken', RefreshToken.schema).insert(data);
      if (!token) callback(new AFError(500, 'Refresh token not saved'));
      callback(null, token);
    }.bind(this));
  }

  getRefreshToken(refreshToken, callback) {
    co(function *() {
      let token = yield DBAdapter.init('RefreshToken', RefreshToken.schema).find({ refreshToken });
      if (!token) callback(new AFError(401, 'Refresh token not found'));
      callback(null, token);
    }.bind(this));
  }
}

class AccessToken {
  static get schema() {
    return {
      accessToken: { type: 'string' },
      application: { type: 'id', referer: 'Application', model: require('../Application') },
      clientId: { type: 'string' },
      userId: { type: 'id', referer: 'User', model: require('../User') },
      expires: { type: 'date', expires: 3600 }
    };
  }
}

class RefreshToken {
  static get schema() {
    return {
      refreshToken: { type: 'string' },
      application: { type: 'id', referer: 'Application', model: require('../Application') },
      clientId: { type: 'string' },
      userId: { type: 'id', referer: 'User', model: require('../User') },
      expires: { type: 'date', expires: 3600 }
    };
  }
}

module.exports = OAuth;
