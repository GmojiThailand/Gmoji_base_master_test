'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Auth = require('../models/Auth');
const Config = require('../config/general');
const User = require('../models/User');
const Service = require('../models/Service');
const SDKConfig = require('../config/sdk')(process.env.NODE_ENV);
const Table = require('../models/Table');
const querystring = require('querystring');
const Validator = require('../models/Validator');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusDictionary = require('../models/dictionaries/Status');

const router = new Router();

/**
 * @param username
 */
router.post('/auth',
  {
    appId: true,
  },
  function* (next) {
    let data = this.request.fields;
    if (!data.username) throw new HttpError(400, 'Bad request!');
    data.username = data.username.trim();
    let userSys;
    // Конвертация пользователя
    let phone = data.username.substr(1);
    const usersTable = yield Table.fetch('users', this.application.id);
    // конвертация соц сеть
    {
      let re = phone ? Validator.buildMongoRegex(phone, {}) : phone;
      let user = yield usersTable.find({phone: re, status: StatusDictionary.ACTIVE}).catch((e) => ({data: null}));
      if (user.data) {
        userSys = yield User.find({id: user.data.user_id, role: RolesDictionary.USER, type: {$ne: 'oauth'}},
          {}, this.application.id);
        if (userSys) {
          userSys.username = data.username;
          userSys.type = 'oauth';
          yield userSys.save();
        }
      }
    }
    // конвертация +8
    {
      let users = yield usersTable.findAll({$or: [{phone: `8${phone}`}, {phone: `7${phone}`}], status: StatusDictionary.ACTIVE});
      if (users.data.length === 1 && users.data[0].phone === `8${phone}`) {
        userSys = yield User.find({id: users.data[0].user_id, username: `8${phone}`, role: RolesDictionary.USER, type: 'oauth'},
          {}, this.application.id);
        if (userSys) {
          userSys.username = `7${phone}`;
          yield userSys.save();
          yield usersTable.findOneAndUpdate({phone: `8${phone}`, status: StatusDictionary.ACTIVE}, {phone: `7${phone}`});
        }
      }
    }

    let options = {
      oauth: Config.application.auth,
    };

    options.oauth.sms_code = Math.round(Math.random() * (9999 - 1298) + 1298).toString();

    // TODO - входная точка для apple
    if (data.username == SDKConfig.iosPhone) options.oauth.sms_code = '9999';

    options.oauth.tokenOptions = SDKConfig.tokenOptions;

    let unique = yield Validator.checkUniquePhone(data.username, this.application.id);
    if (unique === true) {
      userSys = new User({username: data.username, role: RolesDictionary.USER, type: 'oauth'}, this.application.id);
      yield userSys.save();
    } else {
      userSys = yield User.find({username: data.username, role: RolesDictionary.USER},
        {}, this.application.id);
    }
    if (!userSys) throw new HttpError(400, 'User deleted');
    let authCodes = yield Auth.getAllAuthCodes(this, options, {userId: userSys.id.toString()});
    let notification = 'sms_auth_first';
    if (authCodes.length > 0) {
      let codeValues = {};
      // Формирование обьекта уникальных смс кодов с минимальным exp.
      authCodes.map((ac) => {
        codeValues[ac.smsCode];
        if (!codeValues[ac.smsCode]) codeValues[ac.smsCode] = ac.expires;

        if (codeValues[ac.smsCode] >= ac.expires.getTime()) {
          codeValues[ac.smsCode] = ac.expires;
        }
      });

      let maxObj = {expires: 0};
      for (let key in codeValues ) {
        if (codeValues[key] > maxObj.expires) {
          maxObj = {smsCode: key, expires: codeValues[key]};
        }
      }
      if (new Date().getTime() < maxObj.expires.getTime()) {
        options.oauth.sms_code = maxObj.smsCode;
        notification = 'sms_auth';
      }
    }

    let uri = yield Auth.login.oauth2auth(this, options).catch((err) => (null));

    let uriDecode = querystring.parse(uri, '?');


    if (uri && userSys) {
      // Temporarily disable external notify (OTP) service to allow local testing without SMS gateway
      // let notify = yield Service.fetch('notify', this.application.id);
      // notify.data = {to: [{number: userSys.username}], code: options.oauth.sms_code};
      // yield notify.request(notification, this); // sms_auth_first || sms_auth
    } else {
      throw new HttpError(403, 'Permission denied');
    }

    this.body = {
      data: {
        code: uriDecode[Object.keys(uriDecode)[1]],
        // Expose sms_code for local testing when OTP service is disabled
        sms_code: options && options.oauth && options.oauth.sms_code
      },
    };
  });

/**
 * @param code
 * @param sms_code
 */
router.post('/login',
  {
    appId: true,
  },
  function* (next) {
    if (!this.request.fields.sms_code || !this.request.fields.code) throw new HttpError(400, 'Bad request!');
    let data = this.request.fields;
    let options = {
      oauth: Config.application.auth,
    };
    let authCode = yield Auth.getAuthCode(this, options, {authCode: data.code});
    if (!authCode) throw new HttpError(401, 'Login failed!');

    if (data.sms_code !== authCode.smsCode) {
        Auth.doAuthCodeTrying(this, options, {authCode: data.code}, 2);
        throw new HttpError(400, 'Sms code is invalid!');
    }

    // Set the user on the request before calling oauth2login
    // The OAuth2 server needs req.user to be set to generate the token
    const userSys = yield User.find({id: authCode.userId}, {populate: 'role'}, this.application.id);
    if (!userSys) throw new HttpError(404, 'User not found!');
    this.user = userSys;
    this.req.user = userSys;

    let token = yield Auth.login.oauth2login(this, options).catch((err) => {
      console.error('oauth2login error', err);
      if (err && err.code === 400) throw new HttpError(400, 'Code is expired or invalid!');
      if (err && err.code >= 500) throw new HttpError(401, 'Login failed!');
      throw err;
    });

    const usersTable = yield Table.fetch('users', this.application.id);
    const user = yield usersTable.find({user_id: authCode.userId}).catch((e) => ({data: null}));

    if (!user.data) {

        const countersTable = yield Table.fetch('counters', this.application.id);
        let counterValue = yield countersTable.findOneAndUpdate({name: 'users'}, {$inc: {'value.main': 1}}, {new: true, upsert: true});
        
        // If counter doesn't exist, create it
        if (!counterValue || !counterValue.data) {
          const newCounter = yield countersTable.create({name: 'users', value: {main: 1}});
          // Table.create returns TableData directly, wrap it in the expected structure
          counterValue = {data: newCounter};
        }

        let fakeId = counterValue.data.value ? counterValue.data.value.main : counterValue.data.main;
        let p = {user_id: authCode.userId, phone: userSys.username, fake_id: fakeId};
        yield usersTable.create(p)
            .catch((e) => (console.error(e), {data: null}));
    } else if (!user.data.name || !user.data.birthdate || !user.data.email || !user.data.sex) {
        user.data = null;
    }

    this.body = {
      data: {
        token,
        user: user.data,
      },
    };
  });


/**
 * @param user_id
 */
router.post('/edit_profile',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* (next) {
    let data = this.request.fields;
    data.user_id = this.user.id;
    const usersTable = yield Table.fetch('users', this.application.id);

    if (data.email) {
      let uniqueEmail = yield Validator.checkUniqueEmail(data.email, this.application.id);
      if (!uniqueEmail) throw new HttpError(400, 'Email already in use!');
    }

    const userSys = yield User.find({id: data.user_id}, {}, this.application.id);
    if (!userSys) throw new HttpError(404, 'User not found!');

    let user = yield usersTable.find({user_id: data.user_id}).catch((e) => ({data: null}));
    if (!user.data) {
      if (!data.name || !data.birthdate || !data.email || !data.sex) throw new HttpError(400, 'Bad request!');

      const countersTable = yield Table.fetch('counters', this.application.id);
      let counterValue = yield countersTable.findOneAndUpdate({name: 'users'}, {$inc: {'value.main': 1}}, {new: true});

      // Set default status if not provided
      if (!data.status) {
        data.status = StatusDictionary.ACTIVE;
      }

      Object.assign(data, {phone: userSys.username, fake_id: counterValue.data.value.main});
      user.data = yield usersTable.create(data);
    } else {
      // Preserve existing status if not provided in update
      if (!data.status && user.data.status) {
        data.status = user.data.status;
      } else if (!data.status) {
        // If no existing status, set default
        data.status = StatusDictionary.ACTIVE;
      }
      user.data = yield user.data.update(data);
    }

    if(SDKConfig.notifyAfterRegistration) {
      let notify = yield Service.fetch('notify', this.application.id);
      let birth = new Date(user.data.birthdate);
      notify.data = Object.assign(
          {
            birth: birth.toISOString().replace(/(\d{4})-(\d{2})-(\d{2}).*/g, "$3.$2.$1"),
            platform: this.headers['es-app-platform'] || '-',
            platformVersion: this.headers['es-app-platform-version'] || '-',
            appVersion: this.headers['es-app-version'] || '-'
          },
          user.data
      );
      yield notify.request('about_registration', this);
    }

    // Замена триггера на апдейт статус после выгрузки полной замены
    this.body = {
      data: {
        user: user.data,
      },
    };
  });


/**
* @param refresh_token
*/
router.post('/refresh',
  {
    appId: true,
  },
  function* (next) {
    let options = {
      oauth: Config.application.refresh,
    };
    let data = this.request.fields;
    if (!data.refresh_token) throw new HttpError(400, 'Bad reqeust!');
    try {
      let token = yield Auth.refresh.oauth2(this, options);
      // Find user - allow users with USER role or no role (mobile users)
      let userSys = yield User.find({id: token.user_id}, {}, this.application.id);
      if (!userSys) { throw new HttpError(404, 'User not found'); }
      
      // If user has a role, check if it's USER role (for mobile users, role may be null)
      if (userSys.role && userSys.role.id && userSys.role.id.toString() !== RolesDictionary.USER) {
        throw new HttpError(403, 'Permission denied');
      }

      // delete token.refresh_token;

      this.body = token;
    } catch (e) {
      throw new HttpError(404, e || 'Refresh token not found');
    }
  });


router.post('/is_have_user_profile',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* (next) {
    let result = true;

    const usersTable = yield Table.fetch('users', this.application.id);
    yield usersTable.find({user_id: this.user.id}).catch((e) => {
      result = false;
    });


    this.body = {
      data: result,
    };
  });


router.post('/logout',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* (next) {
    let fields = this.request.fields || {};

    if (fields.refresh_token) {
      Object.assign(this.oauth.bearerToken, {refreshToken: fields.refresh_token});
    }

    let options = {
      oauth: Config.application.auth,
    };

    let accessToken = this.oauth.bearerToken.accessToken;
    this.request.fields = accessToken;

    try {
      yield Auth.logout(this, options).catch((err) => null);
      this.body = true;
    } catch (err) {
      console.error(err);
      this.body = false;
    }
  });


module.exports = router;
