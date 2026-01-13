/**
 * Выгрузка карточек контрагента для выбранного товара
 *
 * @param {string} product_id - id товара из таблицы products
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const HttpError = require('../models/Error');
const StatusesDictionary = require('../models/dictionaries/Status');
const Config = require('../config/general');

const utils = require('../models/utils');

const router = new Router();

router.all('/get_product_contragent_cards',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.product_id) { throw new HttpError(400, 'Product id required'); }

    const productsTable = yield Table.fetch('products', this.application.id);
    let product = yield productsTable.find({id: fields.product_id, status: StatusesDictionary.ACTIVE})
      .catch((error) => ({data: null}));

    if (!product.data) { throw new HttpError(404, 'Product not found'); }

    let cards = yield utils.getProductContragentCards(
      this.application,
      {
        params: {
          product_id: fields.product_id,
          status: StatusesDictionary.ACTIVE,
        },
        options: {populate: ['stores']},
      }
    );

    const contragentIds = cards.map((card) => card.contragent_id.toString());

    const contragentsTable = yield Table.fetch('contragents', this.application.id);
    let contragents = yield contragentsTable.findAll({user_id: {$in: contragentIds}});
    contragents = contragents.data;

    cards = cards.map((card) => {
      contragents.map((contragent) => {
        if (card.contragent_id.toString() == contragent.user_id.toString()) {
          card.contragent_name = contragent.name;
          if (contragent.localized_name && contragent.localized_name[Config.defaultLocale]) {
            card.contragent_name = contragent.localized_name[Config.defaultLocale];
          }
        }
      });

      return card;
    });

    this.body = cards;
  });

router.all('/get_product_contragent_card',
    {
        auth: true,
        access: true,
        appId: true,
    },
    function* () {
        const fields = this.request.fields || this.request.query;
        let {populate} = fields;

        let options = {populate: ['stores']};
        if (populate) { options.populate = populate; }

        if (!fields.product_id) { throw new HttpError(400, 'Product id required'); }
        if (!fields.contragent_id) { throw new HttpError(400, 'Contragent id required'); }

        const productsTable = yield Table.fetch('products', this.application.id);
        let product = yield productsTable.find({id: fields.product_id, status: StatusesDictionary.ACTIVE})
            .catch((error) => ({data: null}));
        if (!product.data) { throw new HttpError(404, 'Product not found'); }


        const contragentsTable = yield Table.fetch('contragents', this.application.id);
        let contragent = yield contragentsTable.find({user_id: fields.contragent_id, status: StatusesDictionary.ACTIVE})
            .catch((error) => ({data: null}));
        if (!contragent.data) { throw new HttpError(404, 'Contragent not found'); }

        let cards = yield utils.getProductContragentCards(
            this.application,
            {
                params: {
                    contragent_id: fields.contragent_id,
                    product_id: fields.product_id,
                    status: StatusesDictionary.ACTIVE,
                },
                options: options,
            }
        );

        if(cards.length === 0) {
            throw new HttpError(404, 'Contragent card not found');
        }

        this.body = cards[0];
    });

module.exports = router;
