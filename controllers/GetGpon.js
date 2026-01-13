/**
 * Выдача данных о джипоне
 *
 * @param {string} id - gpon id
 *
 * Доступен для всех ролей.
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');

const utils = require('../models/utils');

const router = new Router();

const Config = require('../config/general');

router.all('/get_gpon',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = Object.assign(this.request.fields || {}, this.request.query || {});

    const certificatesTable = yield Table.fetch('certificates', this.application.id);
    const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);

    const options = {
      select: [
        'buy_date',
        'buyer_id',
        'code',
        'end_sale_date',
        'expiration_days',
        'order_id',
        'product',
        'status',
        'status_updated_at',
        'user_id',
      ],
    };

    let certificate;
    if (this.user.role.id == RolesDictionary.SUB_CONTRAGENT) {
      if (!fields.id) { throw new HttpError(400, 'Gpon id required'); }

      const subcontragentsTable = yield Table.fetch('subcontragents', this.application.id);

      let subcontragent = yield subcontragentsTable.find({user_id: this.user.id.toString()})
        .catch((e) => ({data: null}));
      subcontragent = subcontragent.data;

      if (!subcontragent) { throw new HttpError(400, 'Subcontragent not found'); }

      let subcontragentCards = yield cardsTable.findAll({
        contragent_id: subcontragent.contragent_id,
        status: StatusesDictionary.ACTIVE,
      });
      subcontragentCards = subcontragentCards.data;
      let productIds = subcontragentCards.map((item) => item.product_id.toString());

      certificate = yield certificatesTable.find(
        {
          id: fields.id,
          product: {$in: productIds},
        },
        options
      )
        .catch((e) => ({data: null}));
      certificate = certificate.data;
    }

    if (this.user.role.id == RolesDictionary.CONTRAGENT) {
      if (!fields.id) { throw new HttpError(400, 'Gpon id required'); }

      const contragentsTable = yield Table.fetch('contragents', this.application.id);

      let contragent = yield contragentsTable.find({user_id: this.user.id})
        .catch((e) => ({data: null}));

      certificate = yield certificatesTable.find({id: fields.id}, options)
        .catch((e) => ({data: null}));
      certificate = certificate.data;
    }

    // ------------------------------
    const rulesTable = yield Table.fetch('rules', this.application.id);
    let pinPerm = yield rulesTable.find({route: '/get_gpon#pin'});
    if (pinPerm.data.role.includes(this.user.role.id.toString())) {
      if (!fields.id) { throw new HttpError(400, 'Gpon id required'); }

      options.select.push('pin');

      certificate = yield certificatesTable.find({id: fields.id}, options)
        .catch((e) => ({data: null}));
      certificate = certificate.data;
    }

    // -------------------------------
    if (this.user.role.id == RolesDictionary.USER) {
      if (!fields.id && !fields.order_id) { throw new HttpError(400, 'No params!'); }

      options.select.push('pin', 'delivery_agent', 'delivery_request_date');

      let params = {status: StatusesDictionary.ACTIVE};
      if (fields.id) { params.id = fields.id; }
      if (fields.order_id) { params.order_id = fields.order_id; }

      let certificate = yield certificatesTable.find(params, options)
        .catch((e) => ({data: null}));

      if (!certificate.data) { throw new HttpError(404, 'Gpon not found!'); }

      const categoriesTable = yield Table.fetch('product_categories', this.application.id);
      let categories = yield categoriesTable.findAll({id: {$in: certificate.data.product.categories}});
      categories = categories.data;

      certificate.data.product.categories = categories;

      this.body = certificate;
      return;
    }

    if (!certificate) { throw new HttpError(404, 'Gpon not found'); }

    // Замена списка контрагентов на привязанных в товаре
    if (certificate.product && certificate.product.contragent) {
      let cards = yield cardsTable.findAll({
        product_id: certificate.product.id.toString(),
        status: StatusesDictionary.ACTIVE,
      });
      cards = cards.data;

      certificate.product.contragent = certificate.product.contragent.filter((contragent) => {
        let match = false;
        cards.map((card) => {
          if (card.contragent_id.toString() == contragent.user_id.toString()) {
            match = true;
          }
        });

        return match;
      });
    }

    // Определение типа сертификата
    certificate = utils.detectCertificateStatus(certificate);

    if (certificate.product.localized_name) {
      if (fields.locale && certificate.product.localized_name[fields.locale]) {
        certificate.product.name = certificate.product.localized_name[fields.locale];
      } else {
        certificate.product.name = certificate.product.localized_name[Config.defaultLocale];
      }
    }

    // Добавление стора гашения, если он погашен
    if (certificate.status.id == StatusesDictionary.SPENT) {
      const CPTable = yield Table.fetch('certificate_cashing', this.application.id);

      let CPlace = yield CPTable.find(
        {certificate_id: certificate.id},
        {
          select: ['cashing_place', 'cashing_price', 'cashing_name'],
          populate: 'cashing_place',
        }
      )
        .catch((e)=> ({data: null}));
      CPlace = CPlace.data;

      if (CPlace) {
        certificate.store = CPlace.cashing_place;
        certificate.product.name = CPlace.cashing_name || certificate.product.name;
        certificate.product.output_price = CPlace.cashing_price || certificate.product.output_price;
      }
    }


    this.body = certificate;
  });

module.exports = router;
