/**
 * Поиск джипона для гашения
 *
 * @param {number} code - code джипона
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const Validator = require('../models/Validator');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');

const Config = require('../config/general');

const router = new Router();

router.all('/find_gpon_for_cash',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = Object.assign(this.request.fields || {}, this.request.query || {});

    if (!fields.code) { throw new HttpError(400, 'Code required'); }

    const admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND, RolesDictionary.ADMIN_FIRST];

    const certificatesTable = yield Table.fetch('certificates', this.application.id);

    let options = {};
    if (fields.limit) { options.limit = fields.limit; }
    if (fields.page) { options.skip = fields.page * fields.limit || 0; }
    if (fields.sort) { options.sort = fields.sort; }

    let certificates = [];
    if (this.user.role.id == RolesDictionary.CONTRAGENT) {
      const contragentsTable = yield Table.fetch('contragents', this.application.id);
      let contragent = yield contragentsTable.find({
        user_id: this.user.id,
        status: StatusesDictionary.ACTIVE,
      })
        .catch((e) => ({data: null}));
      contragent = contragent.data;

      if (!contragent) { throw new HttpError(404, 'Contragent not found'); }

      const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
      let cards = yield cardsTable.findAll({
        contragent_id: this.user.id.toString(),
        status: StatusesDictionary.ACTIVE,
      });
      cards = cards.data;

      const productIds = cards.map((card) => card.product_id.toString());

      options.select = ['code', 'status', 'product', 'name', 'buy_date', 'end_sale_date'];
      options.populate = {product: {select: ['_id', 'name', 'description', 'is_delivery', 'code_type', 'icon', 'is_coupon_limited', 'delivery_type', 'localized_name', 'output_price', 'price_without_margin']}};
      let re = Validator.buildMongoRegex(fields.code, {});
      certificates = yield certificatesTable.findAll(
        {
          code: re,
          product: {$in: productIds},
          status: StatusesDictionary.ACTIVE,
          end_sale_date: {$gt: Date.now()},
        },
        options
      );
      certificates = certificates.data;
      certificates.forEach(function (cert) {
        if (cert.product && cert.product.localized_name) {
          if (fields.locale && cert.product.localized_name[fields.locale]) {
            cert.product.name = cert.product.localized_name[fields.locale];
          } else if(cert.product.localized_name[Config.defaultLocale]) {
            cert.product.name = cert.product.localized_name[Config.defaultLocale];
          }
        }
      });
    }

    if (this.user.role.id == RolesDictionary.SUB_CONTRAGENT) {
      const subcontragentsTable = yield Table.fetch('subcontragents', this.application.id);
      let subcontragent = yield subcontragentsTable.find({
        user_id: this.user.id,
        status: StatusesDictionary.ACTIVE,
      })
        .catch((e) => ({data: null}));
      subcontragent = subcontragent.data;

      if (!subcontragent) { throw new HttpError(404, 'Subcontragent not found'); }

      const storesTable = yield Table.fetch('stores', this.application.id);
      let store = yield storesTable.find({
        subcontragent: subcontragent.id.toString(),
        status: StatusesDictionary.ACTIVE,
      })
        .catch((e) => ({data: null}));
      store = store.data;

      let contragentId;
      let storeCards = [];
      let productIds = [];

      const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
      const storeCardsTable = yield Table.fetch('product_store_cards', this.application.id);

      // Определяется старый или новый представитель
      if (store) {
        contragentId = store.user_id;

        let cards = yield cardsTable.findAll({
          stores: store.id.toString(),
          contragent_id: contragentId,
          status: StatusesDictionary.ACTIVE,
        });
        cards = cards.data;

        productIds = cards.map((card) => card.product_id.toString());

        storeCards = yield storeCardsTable.findAll({
          store_id: store.id.toString(),
          product_id: {$in: productIds},
          status: StatusesDictionary.ACTIVE,
        });
        storeCards = storeCards.data;
      } else {
        contragentId = subcontragent.contragent_id;

        let cards = yield cardsTable.findAll({
          contragent_id: contragentId,
          status: StatusesDictionary.ACTIVE,
        });
        cards = cards.data;

        productIds = cards.map((card) => card.product_id.toString());
      }

      options.select = ['code', 'status', 'product', 'name'];
      options.populate = {product: {select: ['_id', 'name', 'description', 'is_delivery', 'code_type', 'icon', 'is_coupon_limited', 'delivery_type', 'localized_name', 'output_price', 'price_without_margin']}};
      let re = Validator.buildMongoRegex(fields.code, {});
      certificates = yield certificatesTable.findAll(
        {
          code: re,
          product: {$in: productIds},
          status: StatusesDictionary.ACTIVE,
          end_sale_date: {$gt: Date.now()},
        },
        options
      );

      certificates = certificates.data;
      certificates.forEach(function (cert) {
        if (cert.product && cert.product.localized_name) {
          if (fields.locale && cert.product.localized_name[fields.locale]) {
            cert.product.name = cert.product.localized_name[fields.locale];
          } else if(cert.product.localized_name[Config.defaultLocale]) {
            cert.product.name = cert.product.localized_name[Config.defaultLocale];
          }
        }
      });
      certificates = certificates.map((certificate) => {
        storeCards.map((storeCard) => {
          if (storeCard.product_id.toString() == certificate.product.id.toString()) {
            certificate.product.name = storeCard.product_name;
            certificate.product.output_price = storeCard.product_price;
          }
        });

        return certificate;
      });
    }

    if (~admins.indexOf(this.user.role.id.toString())) {
      options.select = ['code', 'status', 'product', 'name', 'buy_date', 'end_sale_date'];
      let re = Validator.buildMongoRegex(fields.code, {});
      certificates = yield certificatesTable.findAll(
        {
          code: re,
          status: StatusesDictionary.ACTIVE,
          end_sale_date: {$gt: Date.now()},
        },
        options
      );
      certificates = certificates.data;
      certificates.forEach(function (cert) {
        if (cert.product && cert.product.localized_name) {
          if (fields.locale && cert.product.localized_name[fields.locale]) {
            cert.product.name = cert.product.localized_name[fields.locale];
          } else if(cert.product.localized_name[Config.defaultLocale]) {
            cert.product.name = cert.product.localized_name[Config.defaultLocale];
          }
        }
      });
    }
      let username = this.user.username;
      certificates.forEach(function (cert) {
          if ((username.startsWith('shoko') || username.startsWith('vabisabi') || username.startsWith('dreamfoods') || username.startsWith('akvadom') || username.startsWith('coffeehouse') || username.startsWith('vabis') || username.startsWith('pandaexpress')) && cert.product) {
              cert.product = JSON.parse(JSON.stringify(cert.product));
              if(cert.code.match(/^\d{8,}$/g)) {
                  cert.product.name = cert.code.replace(/^.*(\d{4})(\d{4})$/, '$1-$2') + " " + cert.product.name;
              } else {
                  cert.product.name = cert.code.substr(10) + " " + cert.product.name;
              }
          }
      });

      this.body = certificates;
  });

module.exports = router;
