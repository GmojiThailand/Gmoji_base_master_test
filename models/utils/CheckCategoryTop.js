'use strict';

const HttpError = require('../Error');
const Table = require('../Table');
const StatusesDictionary = require('../dictionaries/Status');

// TODO: Переделать на запрос к БД выбор id категории топ
const topCategoryId = '58e5f191d351f81cc3fa6a0a';

exports.exec = function* (application) {
  const productsTable = yield Table.fetch('products', application.id);

  let products = yield productsTable.findAll({categories: topCategoryId, status: StatusesDictionary.ACTIVE});

  if (products.count >= 300) { throw new HttpError(400, 'Top category product limit exceeded'); }

  return 'OK!';
};
