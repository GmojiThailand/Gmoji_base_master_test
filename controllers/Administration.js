/**
 * Авторизация в системе через административную панель
 *
 * @param {string} username - логин пользователя
 * @param {sting} password - пароль пользователя
 * @param {boolean} is_subcontragent - флаг, определяющий принадлежность юзера к представителям контрагентов
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const User = require('../models/User');
const Auth = require('../models/Auth');
const RolesDictionary = require('../models/dictionaries/Role');

const utils = require('../models/utils');

const router = new Router();

router.all('/login_administration',
  {
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    let admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND, RolesDictionary.ADMIN_FIRST];

    if (!fields.username) { throw new HttpError(400, 'Username required'); }

    // First try to find user by username only
    let userSys = yield User.find(
      {
        username: fields.username,
      },
      {},
      this.application.id
    );

    // Then check if role is not USER
    // If user has no role, allow it (for admin users)
    if (userSys && userSys.role) {
      const roleStr = userSys.role.toString ? userSys.role.toString() : String(userSys.role);
      if (roleStr === RolesDictionary.USER) {
        userSys = null;
      }
    }

    function* failCounter(app, headers) {
      let failCount = yield utils.countInvalidAuthorizations(app, {requestHeaders: headers});

      this.body = {counter: failCount.toString()};
      this.status = 403;
    }

    failCounter = failCounter.bind(this);

    if (!userSys) {
      yield failCounter(this.application, this.headers);
      return;
    }

    // Convert role to string if it exists
    let roleStr = null;
    if (userSys.role) {
      roleStr = userSys.role.toString ? userSys.role.toString() : String(userSys.role);
      userSys.role = roleStr;
    }

    let result;
    let password;

    if (roleStr == RolesDictionary.SUB_CONTRAGENT) {
      let subcontragentTable = yield Table.fetch('subcontragents', this.application.id);
      let subcontragent = yield subcontragentTable.find({user_id: userSys.id})
        .catch((e) => ({data: null}));

      if (!subcontragent.data) {
        result = {id: userSys.id};
      } else {
        result = subcontragent.data;
      }

      if (this.request.headers['authorization'] && this.request.headers['authorization'] == 'Basic  + hash') {
        this.request.headers['authorization'] = 'Basic cXdlOjg4YmYxY2Q3MGQ=';
      }

      password = fields.password || userSys.username;
    }

    if (roleStr && ~admins.indexOf(roleStr)) {
      if (!fields.password) { throw new HttpError(400, 'Password required'); }

      result = {id: userSys.id};
      password = fields.password;
    }

    let rules;
    if (roleStr == RolesDictionary.CONTRAGENT) {
      if (!fields.password) { throw new HttpError(400, 'Password required'); }

      let contragents = yield Table.fetch('contragents', this.application.id);
      let contragent = yield contragents.find({user_id: userSys.id})
        .catch((e) => ({data: null}));

      if (!contragent.data) {
        result = {id: userSys.id};
      } else {
        result = contragent.data;
      }

      password = fields.password;
      rules = yield utils.getContragentProductRules(this.application);
    }

    let options = {
      oauth: {
        accessTokenLifetime: 60 * 60 * 24,
        refreshTokenLifetime: 60 * 60 * 24 * 7,
      },
    };

    // Ensure password is set
    if (!password) {
      password = fields.password;
    }

    // Set application on req object for OAuth
    if (!this.req.application) {
      this.req.application = this.application;
    }
    
    // Debug: Log application info
    console.log('Administration.login - application.id:', this.application ? this.application.id : 'null');
    console.log('Administration.login - req.application.id:', this.req.application ? this.req.application.id : 'null');
    console.log('Administration.login - username:', fields.username, 'password:', password ? '***' : 'null');

    this.request.fields = {username: fields.username, password};

    let failFlag = false;
    let that = this;
    let p = new Promise((resolve, reject) => {
      return Auth.login.oauth(that, options)
        .then((result) => resolve(result))
        .catch((err) => {
          console.error('OAuth login error (first attempt):', err);
          // Try with username as password (for some admin users)
          that.request.fields = {username: fields.username, password: fields.username};

          return Auth.login.oauth(that, options)
            .then((result) => resolve(result))
            .catch((err) => {
              console.error('OAuth login error (second attempt):', err);
              failFlag = true;
              resolve();
            });
        });
    });

    let token = yield p;

    if (failFlag) {
      yield failCounter(this.application, this.headers);
      return;
    } else {
      const tryingLoginHistory = yield Table.fetch('trying_login_history', this.application.id);
      // Get IP address with multiple fallbacks
      const requestIp = this.headers['x-real-ip'] 
        || this.headers['x-remote-addr'] 
        || (this.headers['x-forwarded-for'] && this.headers['x-forwarded-for'].split(',')[0].trim())
        || (this.req && this.req.connection && this.req.connection.remoteAddress)
        || (this.req && this.req.socket && this.req.socket.remoteAddress)
        || '127.0.0.1'; // fallback to localhost if no IP found

      let tryLogin = yield tryingLoginHistory.find({ip: requestIp})
        .catch((err) => ({data: null}));
      tryLogin = tryLogin.data;

      if (tryLogin) {
        yield tryLogin.remove();
      }
    }

    this.body = {
      data: result,
      role: userSys.role,
      token: token,
    };

    if (rules) { this.body.rules = rules; }
  });

router.all('/refresh_administration',
  {
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.refresh_token) { throw new HttpError(400, 'Refresh token required'); }

    let options = {
      oauth: {
        accessTokenLifetime: 60 * 60 * 24,
        refreshTokenLifetime: 60 * 60 * 24 * 7,
      },
    };

    try {
      let token = yield Auth.refresh.oauth(this, options);
      this.body = {token};
    } catch (error) {
      throw new HttpError(404, 'Refresh token not found');
    }
  });

router.all('/check_fails_administration',
  {
    appId: true,
  },
  function* () {
    const tryingLoginHistory = yield Table.fetch('trying_login_history', this.application.id);

    // Get IP address with multiple fallbacks
    const requestIp = this.headers['x-real-ip'] 
      || this.headers['x-remote-addr'] 
      || (this.headers['x-forwarded-for'] && this.headers['x-forwarded-for'].split(',')[0].trim())
      || (this.req && this.req.connection && this.req.connection.remoteAddress)
      || (this.req && this.req.socket && this.req.socket.remoteAddress)
      || '127.0.0.1'; // fallback to localhost if no IP found

    let tryLogin = yield tryingLoginHistory.find({ip: requestIp})
      .catch((err) => ({data: null}));
    tryLogin = tryLogin.data;

    if (!tryLogin) {
      this.body = {counter: 0};
      return;
    }

    const hour = 1000 * 60 * 60;
    if ((Date.now()) - tryLogin.last_try_time > hour) {
      yield tryLogin.remove();

      this.body = {counter: 0};
      return;
    }

    this.body = {counter: tryLogin.try_counter};
  });

/**
 * Reset login counter for testing purposes
 * WARNING: This endpoint should be disabled in production!
 */
router.post('/reset_login_counter',
  {
    appId: true,
  },
  function* () {
    const tryingLoginHistory = yield Table.fetch('trying_login_history', this.application.id);

    // Get IP address with multiple fallbacks
    const requestIp = this.headers['x-real-ip'] 
      || this.headers['x-remote-addr'] 
      || (this.headers['x-forwarded-for'] && this.headers['x-forwarded-for'].split(',')[0].trim())
      || (this.req && this.req.connection && this.req.connection.remoteAddress)
      || (this.req && this.req.socket && this.req.socket.remoteAddress)
      || '127.0.0.1'; // fallback to localhost if no IP found

    let tryLogin = yield tryingLoginHistory.find({ip: requestIp})
      .catch((err) => ({data: null}));
    
    if (tryLogin && tryLogin.data) {
      yield tryLogin.data.remove();
      this.body = {message: 'Login counter reset successfully', ip: requestIp};
    } else {
      this.body = {message: 'No login history found to reset', ip: requestIp};
    }
  });

/**
 * Debug endpoint to check user info
 * WARNING: This endpoint should be disabled in production!
 */
router.post('/check_user',
  {
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;
    
    if (!fields.username) {
      this.body = {error: 'Username required'};
      return;
    }

    // Check if user exists (any role)
    let userSys = yield User.find({username: fields.username}, {}, this.application.id);
    
    if (!userSys) {
      this.body = {
        exists: false,
        message: 'User not found',
        username: fields.username
      };
      return;
    }

    // Check if user has non-USER role
    const hasValidRole = userSys.role && userSys.role.toString() !== RolesDictionary.USER;
    
    this.body = {
      exists: true,
      username: userSys.username,
      role: userSys.role ? userSys.role.toString() : null,
      roleName: userSys.role ? (userSys.role.id ? userSys.role.id.toString() : null) : null,
      hasValidRole: hasValidRole,
      canLogin: hasValidRole,
      userId: userSys.id ? userSys.id.toString() : null
    };
  });

module.exports = router;
