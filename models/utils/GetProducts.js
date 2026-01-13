/*
 * Поиск продуктов по условию с опциями
 *
 * @param {Object} application - объект с информацией о приложении Api Factory
 * @param {Object} options - входные параметры для поиска продуктов
 *
 * @param {Object} params - условия поиска в таблице products
 * @param {Object} options - опции поиска в таблице products
 * @param {boolean} applyLimits - флаг вывод лимитов в продукте
 */
'use strict';

const HttpError = require('../Error');
const Table = require('../Table');
const StatusesDictionary = require('../dictionaries/Status');

const Config = require('../../config/general');

exports.exec = function* (application, {params = {}, options = {}, applyLimits} = options) {
  const productsTable = yield Table.fetch('products', application.id);
  const cardsTable = yield Table.fetch('product_contragent_cards', application.id);

  let locale = params.locale;
  delete params.locale;

  let products = yield productsTable.findAll(params, options);
  products = products.data;
  let productIds = products.map((product) => product.id.toString());

  let allCards = yield cardsTable.findAll({
    product_id: productIds,
    status: StatusesDictionary.ACTIVE,
  });
  allCards = allCards.data;

  products = products.map((product) => {
    let contractors = [];
    allCards.map((allCard) => {
      if (allCard.product_id.toString() == product.id.toString()) {
        product.contragent.map((item) => {
          if (allCard.contragent_id.toString() == item.user_id.toString()) {
            contractors.push(item);
          }
        });
      }
    });
    let contractorIds = contractors.map((contractor) => contractor.user_id.toString());

    product.contragent = contractors;
    product.contragent_cards = contractorIds;

    if (product.localized_name) {
      if (locale && product.localized_name[locale]) {
        product.name = product.localized_name[locale];
      } else {
        product.name = product.localized_name[Config.defaultLocale];
      }
    }

    if (product.localized_value) {
      if (locale && product.localized_value[locale]) {
        product.value = product.localized_value[locale];
      } else {
        product.value = product.localized_value[Config.defaultLocale];
      }
    }

    if (product.localized_value_hint) {
      if (locale && product.localized_value_hint[locale]) {
        product.value_hint = product.localized_value_hint[locale];
      } else {
        product.value_hint = product.localized_value_hint[Config.defaultLocale];
      }
    }

    if (product.localized_description) {
      if (locale && product.localized_description[locale]) {
        product.description = product.localized_description[locale];
      } else if (product.localized_description[Config.defaultLocale]) {
        product.description = product.localized_description[Config.defaultLocale];
      }
    }

    if (product.localized_short_description) {
      if (locale && product.localized_short_description[locale]) {
        product.short_description = product.localized_short_description[locale];
      } else {
        product.short_description = product.localized_short_description[Config.defaultLocale];
      }
    }

    return product;
  });

  if (applyLimits) {
    const limitsTable = yield Table.fetch('limits', application.id);
    let limits = yield limitsTable.findAll({product_id: {$in: productIds}});
    limits = limits.data;

    if (!limits) { throw new HttpError(404, 'Limit not found'); }

    products = products.map((product) => {
      let match;
      limits.map((limit) => {
        if (limit.product_id.toString() == product.id.toString()) {
          match = limit;
        }
      });

      if (!match) { throw new HttpError(404, 'Limit not found'); }

      product.product_limit = match.limit;
      product.product_duration = match.duration;
      return product;
    });
  }

  return products;
};
