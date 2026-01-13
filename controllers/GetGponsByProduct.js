/**
 * Выгрузка списка джипонов по продукту
 *
 * @params {string} product_id - id продукта
 * @params {string} code - серийный номер джипона
 * @params {date} end_sale_date - фильтр по дате до которой действуют джипоны
 * @params {string} status - фильтр по id статуса
 * @params {number} price - фильтр по ценовой категории
 * -----------------------
 * @param - limit
 * @param - page
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const Validator = require('../models/Validator');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');

const router = new Router();

router.all('/get_gpons_by_product',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    const admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND, RolesDictionary.ADMIN_FIRST];

    if (!fields.product_id) {
      throw new HttpError(400, 'Product id required');
    }

    let params = {product: fields.product_id};
    if (fields.code) {
      let re = Validator.buildMongoRegex(fields.code, {});

      params.code = re;
    }
    if (fields.end_sale_date) { params.end_sale_date = {$lt: fields.end_sale_date}; }

    let options = {};
    if (fields.limit) { options.limit = fields.limit; }
    if (fields.page) { options.skip = fields.page * fields.limit || 0; }
    if (fields.sort) { options.sort = fields.sort; }

    const paytureOrdersTable = yield Table.fetch('payture_orders', this.application.id);
    const usersTable = yield Table.fetch('users', this.application.id);
    const certificatesTable = yield Table.fetch('certificates', this.application.id);

    let hiddenStatuses = [StatusesDictionary.DELETED];

    function checkStatuses(available, current) {
      let flag = true;
      current.map((currentItem) => {
        if (!~available.indexOf(currentItem)) {
          flag = false;
        }
      });

      return flag;
    }

    if (this.user.role.id == RolesDictionary.CONTRAGENT) {
      Object.assign(params, {user_id: this.user.id.toString()});

      if (fields.status && fields.status.length) {
        let availableStatuses = [StatusesDictionary.SPENT];

        if (checkStatuses(availableStatuses, fields.status)) {
          params.status = {'$in': fields.status};
        } else {
          throw new HttpError('Invalid gpon status requested');
        }
      } else {
        hiddenStatuses.push(StatusesDictionary.ACTIVE, StatusesDictionary.OVERDUE);
        params.status = {'$nin': hiddenStatuses};
      }
    }

    if (~admins.indexOf(this.user.role.id.toString())) {
      if (fields.status && fields.status.length) {
        let availableStatuses = [StatusesDictionary.ACTIVE, StatusesDictionary.OVERDUE, StatusesDictionary.SPENT];

        if (checkStatuses(availableStatuses, fields.status)) {
          params.status = {'$in': fields.status};
        } else {
          throw new HttpError('Invalid gpon status requested');
        }
      } else {
        params.status = {'$nin': hiddenStatuses};
      }
    }

    let certificates = yield certificatesTable.findAll(params, options);
    let certs = [];
    if (!certificates.data.length) { return this.body = {data: []}; }

    // Выборка для админа с именем пользователя и телефоном
    if (~admins.indexOf(this.user.role.id.toString())) {
      yield certificates.data.map(function* (certificate) {
        delete certificate.pin;

        // добавить имя покупателя и телефон
        let buyer = yield usersTable.find({user_id: certificate.buyer_id})
          .catch((e) => ({data: null}));

        if (!buyer.data) { throw new HttpError(404, 'Buyer not found'); }

        delete certificate.buyer_id;

        Object.assign(certificate, {
          buyer: {
            phone: buyer.data.phone,
            name: buyer.data.name,
            user_id: buyer.data.user_id,
          },
        });

        // Добавление цены по которой был продан
        let order = yield paytureOrdersTable.find({order_id: certificate.order_id})
          .catch((e) => ({data: null}));

        if (!order.data) { throw new HttpError(404, 'Order not found'); }

        if (fields.price || fields.price === 0) {
          if (fields.price == order.data.amount / 100) {
            Object.assign(certificate, {price: order.data.amount / 100});
            certs.push(certificate);
          }
        } else {
          Object.assign(certificate, {price: order.data.amount / 100});
          certs.push(certificate);
        }
      });
    }

    if (this.user.role.id == RolesDictionary.CONTRAGENT) {
      yield certificates.data.map(function* (certificate) {
        delete certificate.pin;

        // Добавление и фильтр цены по которой был продан
        let order = yield paytureOrdersTable.find({order_id: certificate.order_id})
          .catch((e) => ({data: null}));

        if (!order.data) { throw new HttpError(404, 'Order not found'); }

        if (fields.price || fields.price === 0) {
          if (fields.price == order.data.amount / 100) {
            Object.assign(certificate, {price: order.data.amount / 100});
            certs.push(certificate);
          }
        } else {
          Object.assign(certificate, {price: order.data.amount / 100});
          certs.push(certificate);
        }
      });
    }

    switch (fields.sort.price) {
      case 1:
        certs.sort(compareNumericPrice);
        break;
      case -1:
        certs.sort(compareNumericPrice).reverse();
        break;
    }

    switch (fields.sort.end_sale_date) {
      case 1:
        certs.sort(compareNumericEndSale);
        break;
      case -1:
        certs.sort(compareNumericEndSale).reverse();
        break;
    }


    function compareNumericPrice(a, b) {
      if (a.price > b.price) return 1;
      if (a.price < b.price) return -1;
    }

    function compareNumericEndSale(a, b) {
      if (a.end_sale_date > b.end_sale_date) return 1;
      if (a.end_sale_date < b.end_sale_date) return -1;
    }

    this.body = certs;
  });

module.exports = router;
