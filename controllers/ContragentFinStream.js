/**
 * Скрипт сбора информации по денежным потокам
 *
 * @param {date} start_date date - дата начала периода отчета(не обязательный)
 * @param {date} end_date - дата конца периода отчета(не обязательный)
 * @param {string} contragent_id - id контрагента для выгрузки(только для администратора и не обязательный)
 * @param {string array} product_id - массив id продуктов для выгрузки(не обязательный)
 *
 * Если не были указаны параметры, статистика будет собрана
 * за весь период работы приложения по всем товарам
 * для контрагента или контрагентов(в случае администратора)
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Validator = require('../models/Validator');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');

const utils = require('../models/utils');

const router = new Router();

router.all('/contragent_fin_stream',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;
    const admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND];
    const isAdmin = ~admins.indexOf(this.user.role.id.toString());
    const isContragent = this.user.role.id == RolesDictionary.CONTRAGENT;

    function contragentFilter(fields, user) {
      let contragentFilter = {
        status: StatusesDictionary.ACTIVE,
      };

      if (isContragent) {
        contragentFilter.user_id = user.id.toString();
      } else if (isAdmin) {
        contragentFilter.id = fields.contragent_id;
      }

      return contragentFilter;
    }

    function cashingHistoryFilter(fields) {
      let cashingHistoryFilter = {
        $and: [
          {contragent_id: fields.contragent_id},
        ],
      };

      if (fields.begin_date) { cashingHistoryFilter['$and'].push({createdAt: {$gte: fields.begin_date}}); }
      if (fields.end_date) { cashingHistoryFilter['$and'].push({createdAt: {$lte: fields.end_date}}); }

      return cashingHistoryFilter;
    }

    function ordersFilter(fields) {
      let boughtFilter = {
        $and: [
          {product_id: {$in: fields.product_ids}},
          {status: 0},
        ],
      };

      if (fields.begin_date) { boughtFilter['$and'].push({date: {$gte: fields.begin_date}}); }
      if (fields.end_date) { boughtFilter['$and'].push({date: {$lte: fields.end_date}}); }

      return boughtFilter;
    }

    function cardsFilter(fields) {
      return {
        contragent_id: fields.contragent_id,
        status: StatusesDictionary.ACTIVE,
      };
    };

    function limitsFilter(fields) {
      return {
        product_id: {$in: fields.product_ids},
      };
    };

    function productsFilter(fields) {
      let productsFilter = {
        $and: [
          {id: {$in: productIds}},
        ],
      };

      if (fields.name) {
        let re = Validator.buildMongoRegex(fields.name, {included: 'begin'});

        productsFilter['$and'].push({name: re});
      }

      return productsFilter;
    };

    // Проверка существования запрашиваемого контрагента
    let contragents = yield utils.getContragents(this.application, {params: contragentFilter(fields, this.user)});

    if (!contragents.length) { throw new HttpError(404, 'Contragent not found'); }

    let contragent = contragents[0];
    fields.contragent_id = contragent.user_id.toString();


    // Сбор данных о погашенных сертификатах
    let cashingHistory = yield utils.getCashingHistory(
      this.application,
      {
        params: cashingHistoryFilter(fields),
        options: {populate: ['certificate_id']},
      }
    );

    let cashedProductIds = [];
    cashingHistory.map((item) => {
      if (item.product_id) {
        cashedProductIds.push(item.product_id.toString());
      }
    });

    // Поиск товаров и карточек контрагентов в них
    let productContragentCards = yield utils.getProductContragentCards(
      this.application,
      {params: cardsFilter(fields)}
    );

    let cardProductIds = productContragentCards.map((productContragentCard) => {
      return productContragentCard.product_id.toString();
    });

    let productIds = [...new Set([...cashedProductIds, ...cardProductIds])];
    fields.product_ids = productIds;

    // Сбор данных о купленных сертификатах
    let ordersHistory = yield utils.getOrders(
      this.application,
      {
        params: ordersFilter(fields),
        options: {
          sort: {date: 1},
        },
      }
    );

    // Поиск лимитов товаров
    let limits = yield utils.getLimits(
      this.application,
      {
        params: limitsFilter(fields),
        options: {
          sort: {createdAt: 1},
        },
      }
    );

    let period = {
      begin_date: fields.begin_date,
      end_date: fields.end_date,
    };

    if (ordersHistory && ordersHistory.length && !period.begin_date) {
      let date = ordersHistory[0].date;
      period.begin_date = date;
    }

    if (limits && limits.length && !period.begin_date) {
      let date = limits[0].createdAt;
      period.begin_date = date;
    }

    period.begin_date = period.begin_date || contragent.createdAt;
    period.end_date = period.end_date || Date.now();

    // Поиск товаров
    let products = yield utils.getProducts(
      this.application,
      {params: productsFilter(fields)}
    );

    function getProductLimits(product) {
      let limit;
      limits.map((item) => {
        if (item.product_id.toString() == product.id.toString()) {
          limit = item;
        }
      });

      let result = {};
      result.current_limit = limit && limit.limit || 0;
      result.amount = (product.output_price || 0) * 100;

      return result;
    }


    let result = {};
    function setProductSummary(product) {
      let object = {};
      // Сбор данных о стоимости  купленных  джипонах
      if (isAdmin) {
        let soldAmount = 0;
        let soldValue = 0;
        ordersHistory.map((order) => {
          if (order.product_id.toString() == product.id.toString()) {
            soldAmount += order.amount && order.amount / 100 || 0;
            soldValue++;
          }
        });

        Object.assign(object, {
          sold_value: soldValue,
          sold_amount: soldAmount,
        });
      }

      // Сбор данных о стоимости доступных джипонов
      let limit;
      ordersHistory.map((order) => {
        if (order.product_id.toString() == product.id.toString()) {
          if (!limit) {
            limit = order;
          } else {
            limit = order.createdAt < limit.createdAt ? order : limit;
          }
        }
      });

      if (!limit) {
        limit = getProductLimits(product);
      }

      let limitValue = limit.current_limit || 0;
      let limitAmount = limitValue * (limit.amount && limit.amount / 100 || 0);

      Object.assign(object, {
        limit_value: limitValue,
        limit_amount: limitAmount,
      });

      // Сбор данных о стоимости погашенных джипонов
      let cashedAmount = 0;
      let cashedValue = 0;
      cashingHistory.map((item) => {
        if (item.product_id.toString() == product.id.toString()) {
          cashedAmount += item.cashing_price || 0;
          cashedValue++;
        }
      });

      Object.assign(object, {
        cashed_value: cashedValue,
        cashed_amount: cashedAmount,
      });

      // Принадлежит нескольким контрагентам
      let multiOwner = false;

      if (product.user_id.length > 1) { multiOwner = true; }

      Object.assign(object, {multi_owner: multiOwner});

      Object.assign(object, product);
      // Наполняем результирующий объект информацией о продукте
      Object.assign(result, {[product.id]: object});
    };

    products.map(setProductSummary);

    // Подсчет Итого по контрагенту
    let summaryLimitValue = 0;
    let summaryLimitAmount = 0;
    let summaryCashedValue = 0;
    let summaryCashedAmount= 0;
    let summarySoldValue;
    let summarySoldAmount;

    if (isAdmin) {
      summarySoldValue = 0;
      summarySoldAmount = 0;
    }

    Object.keys(result).map((key) => {
      summaryLimitValue += result[key].limit_value;
      summaryLimitAmount += result[key].limit_amount;

      if (isAdmin) {
        summarySoldValue += result[key].sold_value;
        summarySoldAmount += result[key].sold_amount;
      }

      summaryCashedValue += result[key].cashed_value;
      summaryCashedAmount += result[key].cashed_amount;
    });

    let summary = {
      limit_value: summaryLimitValue,
      limit_amount: summaryLimitAmount,
      sold_value: summarySoldValue,
      sold_amount: summarySoldAmount,
      cashed_value: summaryCashedValue,
      cashed_amount: summaryCashedAmount,
    };

    this.body = {
      contractor_name: contragent.name,
      contractor_inn: contragent.inn,
      data: result,
      summary: summary,
      period: period,
    };
  });

module.exports = router;
