'use strict';

const HttpError = require('../Error');
const Table = require('../Table');
const Validator = require('../Validator');

exports.exec = function* (application, {id, productName, categoryName, contragentName, storeName, productLocalizedName, categoryLocalizedName} = options) {
  if (productName && categoryName && contragentName && storeName && productLocalizedName && categoryLocalizedName) {
    throw new HttpError(400, 'No name param');
  }

  const productsTable = yield Table.fetch('products', application.id);
  const categoryTable = yield Table.fetch('product_categories', application.id);
  const contragentsTable = yield Table.fetch('contragents', application.id);
  const storesTable = yield Table.fetch('stores', application.id);

  const activeStatus = '598d9bac47217f28ba69e0f5';
  let isUnique = false;

  if (productName) {
    let re = Validator.buildMongoRegex(productName, {included: 'full'});
    let filter = {name: re, status: activeStatus};
    if (id) {
      filter.id = {'$ne': id};
    }
    let product = yield productsTable
      .find(filter)
      .catch((e) => (console.log(e), {data: null}));

    if (!product.data) { isUnique = true; }
  }

  if (categoryName) {
    let re = Validator.buildMongoRegex(categoryName, {included: 'full'});
    let filter = {name: re, status: activeStatus};
    if (id) {
      filter.id = {'$ne': id};
    }
    let category = yield categoryTable
      .find(filter)
      .catch((e) => (console.log(e), {data: null}));

    if (!category.data) { isUnique = true; }
  }

  if (contragentName) {
    let re = Validator.buildMongoRegex(contragentName, {included: 'full'});
    let contragent = yield contragentsTable
      .find({name: re, status: activeStatus})
      .catch((e) => (console.log(e), {data: null}));

    if (!contragent.data) { isUnique = true; }
  }

  if (storeName) {
    let re = Validator.buildMongoRegex(storeName, {included: 'full'});
    let store = yield storesTable.find({name: re, status: activeStatus})
      .catch((e) => (console.log(e), {data: null}));

    if (!store.data) { isUnique = true; }
  }

  if (productLocalizedName) {
    let localeCode = productLocalizedName.code;
    let localized_name = productLocalizedName.name;
    if (localeCode && localized_name) {
      let re = Validator.buildMongoRegex(localized_name, {included: 'full'});
      let finder = {status: activeStatus};
      finder['localized_name.' + localeCode] = re;
      let product = yield productsTable
        .find(finder)
        .catch((e) => (console.log(e), {data: null}));

      if (!product.data) {
        isUnique = true;
      }
    }
  }

  if (categoryLocalizedName) {
    let localeCode = categoryLocalizedName.code;
    let localized_name = categoryLocalizedName.name;
    if (localeCode && localized_name) {
      let re = Validator.buildMongoRegex(localized_name, {included: 'full'});
      let finder = {status: activeStatus};
      finder['localized_name.' + localeCode] = re;
      let category = yield categoryTable
        .find(finder)
        .catch((e) => (console.log(e), {data: null}));

      if (!category.data) {
        isUnique = true;
      }
    }
  }

  return isUnique;
};
