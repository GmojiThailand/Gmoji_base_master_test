'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const HttpError = require('../models/Error');
const User = require('../models/User');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');
const AccessToken = require('../models/SystemTokens/AccessToken');

const utils = require('../models/utils');

const router = new Router();

router.all('/email_verification',
  {},
  function* () {
    try {
      const fields = this.request.fields || this.request.query;

      if (!fields.t) {
        throw new HttpError(400, 'Verification token required');
      }

      this.application = {id: '587640c995ed3c0c59b14600'};

      let token = decodeURIComponent(fields.t);
      const emailTokensTable = yield Table.fetch('email_verification_tokens', this.application.id);
      let emailToken = yield emailTokensTable.find({
        token,
        status: StatusesDictionary.ACTIVE,
        expiration_date: {$gt: Date.now()},
      })
        .catch((e) => ({data: null}));
      emailToken = emailToken.data;

      if (!emailToken) {
        throw new HttpError(404, 'Verification token not found');
      }

      try {
        yield utils.checkUniqueParams(this.application, {username: emailToken.email});
      } catch (error) {
        throw new HttpError(400, 'Contragent is not unique');
      }

      let userSys = yield User.find(
        {
          id: emailToken.user_id,
          role: RolesDictionary.CONTRAGENT,
        },
        {},
        this.application.id
      );

      if (!userSys) {
        throw new HttpError(404, 'User not found');
      }

      const contragentsTable = yield Table.fetch('contragents', this.application.id);
      let contragent = yield contragentsTable.find({
        user_id: userSys.id.toString(),
        status: StatusesDictionary.ACTIVE,
      })
        .catch((e) => ({data: null}));
      contragent = contragent.data;

      if (!contragent) {
        throw new HttpError(404, 'Contragent not found');
      }

      userSys.username = emailToken.email;
      yield userSys.save();

      yield emailTokensTable.updateMany(
        {
          email: emailToken.email,
          status: StatusesDictionary.ACTIVE,
        },
        {
          status: StatusesDictionary.DELETED,
        });

      // Удаление токенов авторизации КА, чтобы у него произошел logout
      const accessToken = new AccessToken();
      yield accessToken.remove({userId: userSys.id.toString()});

      this.body =
      '<div>' +
          '<h1>Активация вашей электронной почты успешна, пройдите повторную авторизацию</h1>' +
      '</div>';
    } catch (error) {
      console.error(error);

      this.body =
      '<div>' +
          '<h1>' +
              'Произошла ошибка при активации вашей электронной почты,' +
              'обратитесь в службу поддержки support@gmoji.world' +
          '</h1>' +
      '</div>';
    }
  });

module.exports = router;
