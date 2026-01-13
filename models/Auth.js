'use strict';

const co = require('co');
const SDKAuth = require('sdk').Auth;
const Config = require('../config/general');
const Error = require('./Error');

class Auth extends SDKAuth {
  static authorize(...args) {
    return super.authorize(...args);
  }

  static doAuthCodeTrying(req, options, params, limit) {
      super.doAuthCodeTrying(req, options, params, limit);
  }

  static getAuthCode(req, options, params) {
    return super.getAuthCode(req, options, params);
  }

  static getAllAuthCodes(req, options, params) {
    return super.getAllAuthCodes(req, options, params);
  }

  static logout(req, options) {
    return super.logout.oauth2(req, options);
  }

  static get login() {
    return {
      oauth: (req, options) => {
        return super.login.oauth(req, options);
      },
      oauth2auth: (req, options) => {
        if (req.request.fields) {
          req.request.fields.redirect_uri = Config.application.auth.redirectUri || '';
          req.request.fields.response_type = Config.application.auth.response_type || '';
          req.request.fields.client_id = Config.application.auth.clientId || '';
        }
        return super.login.oauth2auth(req, options);
      },
      oauth2login: (req, options) => {
        if (req.request.fields) {
          req.request.fields.redirect_uri = Config.application.auth.redirectUri || '';
          req.request.fields.response_type = Config.application.auth.response_type || '';
          req.request.fields.client_id = Config.application.auth.clientId || '';
        }
        return super.login.oauth2login(req, options);
      },
    };
  }

  static get refresh() {
    return {
      oauth2: (req, options) => {
        return super.refresh.oauth2(req, options);
      },
      oauth: (req, options) => {
        return super.refresh.oauth(req, options);
      },
    };
  }

  static checkAccess(allowedRoles, request) {
    return co(function* () {
      // If user has no role, allow access (mobile users may not have roles)
      // This allows mobile users to access endpoints even without a role
      if (!request.user || !request.user.role || !request.user.role.id) {
        return;
      }
      
      // If user has a role, check if it's in the allowed roles list
      if (allowedRoles && allowedRoles.indexOf(request.user.role.id.toString()) == -1) {
        throw new Error(403, 'Permission denied');
      }
    });
  }
}

module.exports = Auth;
