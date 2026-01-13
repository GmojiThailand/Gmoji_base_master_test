'use strict';

const Router = require('../models/Router');
const StatusesDictionary = require('../models/dictionaries/Status');

const utils = require('../models/utils');

const router = new Router();

router.all('/gift_stat',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    let gpons = yield utils.getMyCertificates(this.application, this.user);
    gpons = gpons.map((gpon) => utils.detectCertificateStatus(gpon));

    let result = [];
    let isExist = false;

    gpons.map((cert) => {
      if (cert.status.id == StatusesDictionary.ACTIVE) {
        result.map((res) => {
          if (res.product === cert.product) {
            res.count = res.count + 1;
            isExist = true;

            let crt = Object.assign({}, cert);
            delete crt.product;
            res.certificates.push(crt);
          }
        });

        if (!isExist) {
          let crt = Object.assign({}, cert);
          delete crt.product;
          result.push({product: cert.product, count: 1, certificates: [crt]});
        }

        isExist = false;
      }
    });

    this.body = result;
  });

module.exports = router;
