/**
 * Выгрузка списка сертификатов юзера, которыми он владеет
 */
'use strict';

const Router = require('../models/Router');
const RolesDictionary = require('../models/dictionaries/Role');

const utils = require('../models/utils');

const router = new Router();

router.all('/get_my_certificates',
  {
    auth: true,
    access: [RolesDictionary.USER],
    appId: true
  },
  function* () {
        const fields = Object.assign(this.request.fields || {}, this.request.query || {});
        let options = yield utils.getOptions(fields);
        const gpons = yield utils.getMyCertificates(this.application, this.user, fields, options);

        this.body = gpons;
  });

module.exports = router;
