'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const HttpError = require('../models/Error');
const StatusesDictionary = require('../models/dictionaries/Status')

const router = new Router();

router.post('/create_locale',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {name, code, country} = this.request.fields;
    if (!name || !code) throw new HttpError(400, 'Bad request');
    const localeTable = yield Table.fetch('locale', this.application.id);
    let locale = yield localeTable.find({name}).catch((e) => ({data: null}));
    if (locale.data) {
      throw new HttpError(400, 'Locale with the same name already exists');
    }
    locale = yield localeTable.find({code}).catch((e) => ({data: null}));
    if (locale.data) {
      throw new HttpError(400, 'Locale with the same code already exists');
    }
    locale = yield localeTable.create({name, code, country, status: StatusesDictionary.ACTIVE});
    this.body = locale;
  });

router.post('/edit_locale',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const data = this.request.fields;
    if (!data.id) throw new HttpError(400, 'Bad request');
    const localeTable = yield Table.fetch('locale', this.application.id);
    if (data.name) {
      let locale = yield localeTable.find({name: data.name}).catch((e) => ({data: null}));
      if (locale.data) {
        throw new HttpError(400, 'Locale with the same name already exists');
      }
      locale = yield localeTable.find({code: data.code}).catch((e) => ({data: null}));
      if (locale.data) {
        throw new HttpError(400, 'Locale with the same code already exists');
      }
    }
    let locale;
    try {
      locale = yield localeTable.findOneAndUpdate({id: data.id, status: StatusesDictionary.ACTIVE}, data, {new: true});
    } catch (e) {
      throw new HttpError(404, 'Locale not found');
    }

    this.body = locale.data;
  });

router.all('/get_locale',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {id} = this.request.fields;
    if (!id) throw new HttpError(400, 'Bad request');
    const localeTable = yield Table.fetch('locale', this.application.id);
    let locale = yield localeTable.find({id, status: StatusesDictionary.ACTIVE}).catch((e) => ({data: null}));
    if (!locale.data) { throw new HttpError(404, 'Locale not found'); }
    this.body = locale.data;
  });

router.all('/get_all_locales',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const localeTable = yield Table.fetch('locale', this.application.id);
    this.body = (yield localeTable.findAll({status: StatusesDictionary.ACTIVE})).data;
  });

router.post('/delete_locale',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {id} = this.request.fields;
    if (!id) throw new HttpError(400, 'Bad request');
    try {
      const localeTable = yield Table.fetch('locale', this.application.id);
      yield localeTable.remove({id});
    } catch (e) {
      throw new HttpError(400, 'Cant delete locale');
    }
    this.body = {data: 'ok'};
  });


module.exports = router;
