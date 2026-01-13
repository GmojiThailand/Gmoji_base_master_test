'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const request = require('request');
const sdkConfig = require('../config/sdk')(process.env.NODE_ENV);

const router = new Router();

router.all('/ewallet_registration',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const usersTable = yield Table.fetch('users', this.application.id);

    let user = yield usersTable.find({user_id: this.user.id}).catch((e) => ({data: null}));

    if (!user || !user.data || !user.data.phone) { throw new HttpError(404, 'Phone not found'); }

    let check = yield eWalletCheckUser(this);
    let json;
    try {
      json = JSON.parse(check);
    } catch (error) {
      throw new HttpError(404, 'Ewallet check user failed');
    }

    if (json.Success == 'True') { return this.body = json; }

    let result = yield eWalletRegistration(this);

    function* eWalletRegistration(ctx) {
      return new Promise(function(resolve, reject) {
        const password = Math.round(Math.random() * (99999999 - 12989999) + 12989999).toString();

        request(sdkConfig.eWalletHostname + ctx.user.id +
                '&password=' + password +
                '&phone=' + user.data.phone,
                (error, response, body) => {
          if (error) { reject(err); }
          resolve(body);
        });
      });
    }

    function* eWalletCheckUser(ctx) {
      return new Promise(function(resolve, reject) {
        request(sdkConfig.eWalletHostname + ctx.user.id, (error, response, body) => {
          if (error) { reject(err); }
          resolve(body);
        });
      });
    }

    this.body = result;
  });

  module.exports = router;
