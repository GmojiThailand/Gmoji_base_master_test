'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const HttpError = require('../models/Error');
const StatusesDictionary = require('../models/dictionaries/Status')

const router = new Router();

router.post('/create_product_tag',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {name} = this.request.fields;
    if (!name) throw new HttpError(400, 'Bad request');
    const productTagTable = yield Table.fetch('tag', this.application.id);
    this.body = yield productTagTable.create({name, status: StatusesDictionary.ACTIVE});
  });

router.post('/edit_product_tag',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const data = this.request.fields;
    if (!data.id) throw new HttpError(400, 'Bad request');
    const productTagTable = yield Table.fetch('tag', this.application.id);
    let tag;
    try {
      tag = yield productTagTable.findOneAndUpdate({
        id: data.id,
        status: StatusesDictionary.ACTIVE
      }, data, {new: true});
    } catch (e) {
      throw new HttpError(404, 'Tag not found');
    }

    this.body = tag.data;
  });

router.all('/get_product_tag',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {id} = this.request.fields || this.request.query;
    if (!id) throw new HttpError(400, 'Bad request');
    const productTagTable = yield Table.fetch('tag', this.application.id);
    let tag = yield productTagTable.find({id, status: StatusesDictionary.ACTIVE}).catch((e) => ({data: null}));
    if (!tag.data) {
      throw new HttpError(404, 'Tag not found');
    }
    this.body = tag.data;
  });

router.all('/get_all_product_tags',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    let filter = {status: StatusesDictionary.ACTIVE};
    const productTagTable = yield Table.fetch('tag', this.application.id);
    let tags = yield productTagTable.findAll(filter).catch((e) => ({data: null}));
    if (!tags.data) {
      throw new HttpError(404, 'Tags not found');
    }
    this.body = tags.data;
  });

router.post('/delete_product_tag',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {id} = this.request.fields;
    if (!id) throw new HttpError(400, 'Bad request');
    try {
      const productTagTable = yield Table.fetch('tag', this.application.id);
      yield productTagTable.remove({id});
    } catch (e) {
      throw new HttpError(400, 'Cant delete tag');
    }
    this.body = {data: 'ok'};
  });

module.exports = router;
