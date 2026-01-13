/**
 * Выгрузка в 1С по ИНН контрагента
 *
 * @param {number} inn - ИНН контрагента
 * @param {string} api_key - ключ доступа к контроллеру
 * @param {boolean} details - флаг обозначающий подбробную выгрузку по джипонам товаров
 * @param {date} begin_date - дата начала периода выборки данных
 * @param {date} end_date - дата конца периода выборки данных
 */
'use strict';

const fs = require('fs');
const ch = require('child_process');

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const StatusesDictionary = require('../models/dictionaries/Status');

const utils = require('../models/utils');

const router = new Router();

const apiKey = 'RE8gVSBLTk9XIERBIFdBWSBNWSBCUlVEREE=';

router.all('/one_s_accounting_export',
  {
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    function commissionSet(commissionValue) {
      if (!commissionValue || commissionValue == -1) {
        return contragent.commission_common;
      }

      return commissionValue;
    }

    function formatDate(date) {
      let convertedDate = new Date(date);
      let formated = convertedDate.toLocaleDateString('en-US', {day: '2-digit', month: '2-digit', year: 'numeric'});
      return formated.replace(
        /(\d{2})\/(\d{2})\/(\d{4})/g,
        (match, month, date, year) => {
          return [date, month, year].join('.');
        });
    }

    function formatNumberFields(field) {
      if (!field) { return 0.00; }

      let fieldString = field.toFixed(2);
      let fieldFloat = parseFloat(fieldString);

      return Number.isNaN(fieldFloat) ? 0.00 : fieldFloat;
    }

    function setRowIncome(row, product) {
      let agentIncome = ((product.commission * 0.01) * (row.cashing_price || row.product_total_price));
      row.agent_income = formatNumberFields(agentIncome);

      let pricipalIncome = (row.cashing_price - row.agent_income);
      let pricipalIncomeFloat = formatNumberFields(pricipalIncome);
      row.pricipal_income = pricipalIncomeFloat < 0.00 ? 0.00 : pricipalIncomeFloat;

      return row;
    }

    function contragentFilter(fields) {
      let contragentFilter = {
        status: StatusesDictionary.ACTIVE,
      };

      if (fields.contragent_id) {
        contragentFilter.id = fields.contragent_id;
      } else {
        contragentFilter.inn = fields.inn;
      }

      return contragentFilter;
    }

    function cashingHistoryFilter(fields) {
      let cashingHistoryFilter = {
        $and: [
          {contragent_id: fields.contragent_id},
        ],
      };

      if (fields.begin_date) { cashingHistoryFilter['$and'].push({createdAt: {'$gte': fields.begin_date}}); }
      if (fields.end_date) { cashingHistoryFilter['$and'].push({createdAt: {'$lte': fields.end_date}}); }

      return cashingHistoryFilter;
    }

    function cardsFilter(fields) {
      return {
        contragent_id: fields.contragent_id,
        product_id: {$in: fields.product_ids},
        status: StatusesDictionary.ACTIVE,
      };
    };

    function createDayTimestamp() {
      let now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0).getTime();
    }

    if (!fields.inn && !fields.contragent_id) { throw new HttpError(400, 'INN or contragent id required'); }
    if (!fields.api_key) { throw new HttpError(400, 'Api key required'); }

    if (fields.api_key != apiKey) { throw new HttpError(403, 'Incorrect api key'); }

    // Проверка существования запрашиваемого контрагента
    let contragents = yield utils.getContragents(this.application, {params: contragentFilter(fields)});

    if (!contragents.length) { throw new HttpError(404, 'Contragent not found'); }

    let contragent = contragents[0];
    fields.contragent_id = contragent.user_id.toString();

    let result = {};
    result.contragent = {
      name: contragent.name,
      inn: contragent.inn,
      agent_contract_date: formatDate(contragent.agent_contract_date),
      agent_contract_number: contragent.agent_contract_number,
    };

    if (!fields.begin_date) { fields.begin_date = contragent.createdAt; }
    if (!fields.end_date) { fields.end_date = Date.now(); }

    result.period = {
      begin_date: formatDate(fields.begin_date),
      end_date: formatDate(fields.end_date),
    };

    // Сбор данных о погашенных сертификатах
    let cashingHistory = yield utils.getCashingHistory(
      this.application,
      {
        params: cashingHistoryFilter(fields),
        options: {populate: ['certificate_id']},
      }
    );

    let cashedCertificates = [];
    let productIds = [];
    cashingHistory.map((item) => {
      if (item.certificate_id) {
        cashedCertificates.push(item.certificate_id);
      }

      if (item.product_id) {
        productIds.push(item.product_id.toString());
      }
    });

    // Поиск товаров и карточек контрагентов в них
    let productContragentCards = yield utils.getProductContragentCards(
      this.application,
      {
        params: cardsFilter({contragent_id: fields.contragent_id, product_ids: productIds}),
      }
    );

    let products = yield utils.getProducts(
      this.application,
      {
        params: {id: {$in: productIds}},
      }
    );

    // Валидация и упрощение содержимого карточек контрагента
    productContragentCards = productContragentCards.map((card) => {
      return {
        product_id: card.product_id ? card.product_id : '',
        commission: commissionSet(card.commission_individual),
        product_name_aliase: card.product_name_aliase,
      };
    });

    // Валидация и упрощение содержимого товаров
    products = products.map((product) => {
      productContragentCards.map((card) => {
        if (product.id.toString() == card.product_id.toString()) {
          product.commission = card.commission;
          product.product_name = card.product_name_aliase || product.name;
        }
      });

      if (!product.commission) { product.commission = contragent.commission_common; }
      if (!product.product_name) { product.product_name = product.name; }

      return product;
    });

    result.details = fields.details ? true : false;

    if (fields.details) {
      let rows = [];
      let summary = {
        cashing_price: 0.00,
        agent_income: 0.00,
        pricipal_income: 0.00,
      };

      cashedCertificates.map((certificate) => {
        let row = {};

        cashingHistory.map((item) => {
          if (item.certificate_id.id.toString() == certificate.id.toString()) {
            row.cashing_price = formatNumberFields(item.cashing_price) || 0.00;
            row.cashing_date = item.createdAt ? formatDate(item.createdAt) : undefined;
            row.product_name = item.cashing_name || '';
          }
        });

        products.map((product) => {
          if (product.id.toString() == (certificate.product && certificate.product.id)) {
            if (!row.product_name) {
              row.product_name = product.product_name ? product.product_name : '';
            }
            row.commission = product.commission ? `${product.commission}%` : '';
            row.agent_income = 0.00;
            row.pricipal_income = 0.00;

            if (product.commission) {
              row = setRowIncome(row, product);
            }
          }
        });

        row.code = certificate.code;

        rows.push(row);

        summary.cashing_price += row.cashing_price;
        summary.agent_income += row.agent_income ? row.agent_income : 0.00;
        summary.pricipal_income += row.pricipal_income ? row.pricipal_income : 0.00;
      });

      result.rows = rows;
      result.summary = {
        cashing_price: formatNumberFields(summary.cashing_price),
        agent_income: formatNumberFields(summary.agent_income),
        pricipal_income: formatNumberFields(summary.pricipal_income),
      };
    } else {
      let rows = [];
      let summary = {
        product_total_price: 0.00,
        agent_income: 0.00,
        pricipal_income: 0.00,
      };

      products.map((product) => {
        let count = cashedCertificates.filter((certificate) => {
          return product.id.toString() == (certificate.product && certificate.product.id) ? certificate : false;
        });

        let row = {};
        let certificatesCount = count.length;
        let productPrice = formatNumberFields(product.output_price);
        let productTotalPrice = productPrice * certificatesCount;

        row.product_name = product.product_name ? product.product_name : '';
        row.product_price = productPrice;
        row.commission = product.commission ? `${product.commission}%` : '';
        row.gpons_count = certificatesCount;
        row.product_total_price = productTotalPrice;

        if (product.commission) {
          row = setRowIncome(row, product);
        }

        rows.push(row);

        summary.product_total_price += row.product_total_price;
        summary.agent_income += row.agent_income ? row.agent_income : 0.00;
        summary.pricipal_income += row.pricipal_income ? row.pricipal_income : 0.00;
      });

      result.rows = rows;
      result.summary = {
        product_total_price: formatNumberFields(summary.product_total_price),
        agent_income: formatNumberFields(summary.agent_income),
        pricipal_income: formatNumberFields(summary.pricipal_income),
      };
    }

    let jsonObject = JSON.stringify(result);
    let filename = 'cfs_' + Date.now() + '.json';

    let jsonstorage = {
      root: __dirname + '/../',
      location: 'json-storage/',
    };
    let dayTimestamp = createDayTimestamp();
    let dir = `${jsonstorage.root}${jsonstorage.location}${dayTimestamp}/`;
    let filepath = `${dir}${filename}`;

    let saveJSON = new Promise((resolve, reject) => {
      ch.exec(`mkdir -p ${dir}`, (err, stdout, stderr) => {
        if (err) { return reject(err); }

        fs.writeFile(filepath, jsonObject, 'utf8', (err) => {
          if (err) { return reject(err); }
          resolve();
        });
      });
    });

    let jsonFileLink = '';

    yield saveJSON
      .then(() => {
        jsonFileLink = filepath;
      })
      .catch((err) => {
        console.error(err);
        throw new HttpError(400, 'Error occured while writing JSON Object to File.');
      });

    this.body = {jsonfile: jsonFileLink};
  });

module.exports = router;
