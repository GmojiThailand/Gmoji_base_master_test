/**
 * Выгрузка категорий и количества товаров в каждой из них
 *
 * @params {string} name - наименование категории(опционально)
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const Validator = require('../models/Validator');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');

const utils = require('../models/utils');

const Config = require('../config/general');

const router = new Router();

router.all('/get_categories',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = Object.assign(this.request.fields || {}, this.request.query || {});

    const admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND, RolesDictionary.ADMIN_FIRST];

    let params = {
      status: StatusesDictionary.ACTIVE,
    };

    let targets = (this.headers['app-targets'] || 'app').split(",").map(v => v.trim());

    if (!admins.includes(this.user.role.id.toString())) {
      params.targets = {$in: targets};
    }

    if (this.user.role.id == RolesDictionary.USER) {
      Object.assign(params, {hidden: {$ne: true}});

      const isAdult = yield utils.checkIsAdult(this.application, this.user);

      if (!isAdult) {
        Object.assign(params, {is_adult: false});
      }
    }

    if (fields.name) {
      let re = Validator.buildMongoRegex(fields.name, {});

      params.name = re;
    }

    let options = {};
    if (fields.limit) {
      options.limit = fields.limit;
    }
    if (fields.page) {
      options.skip = fields.page * fields.limit || 0;
    }
    // if (fields.sort) { options.sort = fields.sort; }
    options.sort = 'fake_id name';

    const categoriesTable = yield Table.fetch('product_categories', this.application.id);
    const productsTable = yield Table.fetch('products', this.application.id);

    let categories = yield categoriesTable.findAll(params, options);
    categories = categories.data;
    const categoryIds = categories.map((category) => category.id.toString());

    if (~admins.indexOf(this.user.role.id.toString())) {
      let filter = {
        categories: {$in: categoryIds},
        status: StatusesDictionary.ACTIVE,
        hidden: {$ne: true}
      };
      let products = yield productsTable.findAll(filter);
      products = products.data;

      products = products.map((product) => {
        product.categories = product.categories.map((category) => category.toString());
        return product;
      });

      categories = categories.map((category) => {
        let productsCount = 0;
        products.map((product) => {
          if (~product.categories.indexOf(category.id.toString())) {
            productsCount += 1;
          }
        });

        category.count = productsCount;
        return category;
      });
    } else if (this.user.role.id == RolesDictionary.CONTRAGENT) {
      const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
      let cards = yield cardsTable.findAll({
        contragent_id: this.user.id.toString(),
        status: StatusesDictionary.ACTIVE,
      });
      cards = cards.data;
      const productIds = cards.map((card) => card.product_id.toString());

      let filter = {
        categories: {$in: categoryIds},
        status: StatusesDictionary.ACTIVE,
        id: {$in: productIds},
        hidden: {$ne: true}
      };

      let products = yield productsTable.findAll(filter);
      products = products.data;

      products = products.map((product) => {
        product.categories = product.categories.map((category) => category.toString());
        return product;
      });

      categories = categories.map((category) => {
        let productsCount = 0;
        products.map((product) => {
          if (~product.categories.indexOf(category.id.toString())) {
            productsCount += 1;
          }
        });
        category.count = productsCount;
        return category;
      });
    } else if (this.user.role.id == RolesDictionary.USER && fields.city_id) {
      let cityIds = [fields.city_id];
      const cityTable = yield Table.fetch('city', this.application.id);
      let city = yield cityTable.find({
        id: fields.city_id,
        status: StatusesDictionary.ACTIVE,
      }).catch((e) => ({data: null}));
      city = city.data;
      if (city && city.level == 0) {
        let cities = yield cityTable.findAll({
          parent: city.id,
          status: StatusesDictionary.ACTIVE,
        }).catch((e) => ({data: null}));
        cities = cities.data;
        cities.forEach((v) => {
          cityIds.push(v.id.toString());
        });
      }
      let filter = {
        categories: {$in: categoryIds},
        targets: {$in: targets},
        status: StatusesDictionary.ACTIVE,
        $and: [
          {contragent: {$nin: [null]}},
          {contragent: {$ne: []}},
          {contragent: {$exists: true}},
          {user_id: {$nin: [null]}},
          {user_id: {$ne: []}},
          {user_id: {$exists: true}},
          {hidden: {$ne: true}}
        ],
        $or: [{item_type: 'ONLINE'}, {cities: {$in: cityIds}}]
      };

      if(Array.isArray(Config.noOnlineFor) && Config.noOnlineFor.length > 0 && Config.noOnlineFor.includes(fields.city_id)) {
        filter.item_type = {$ne: 'ONLINE'};
      }

      let products = yield productsTable.findAll(filter);
      products = products.data;
      products = products.map((product) => {
        product.categories = product.categories.map((category) => category.toString());
        return product;
      });

      categories = categories.reduce((res, category) => {
        let productsCount = 0;
        products.map((product) => {
          if (~product.categories.indexOf(category.id.toString())) {
            productsCount += 1;
          }
        });
        if (productsCount > 0) {
          res.push(category);
        }
        return res;
      }, []);
    }

    categories = categories.map((category) => {
      if (category.localized_name) {
        if (fields.locale && category.localized_name[fields.locale]) {
          category.name = category.localized_name[fields.locale];
        } else if(category.localized_name[Config.defaultLocale]) {
          category.name = category.localized_name[Config.defaultLocale];
        }
      }
      return category;
    });

    this.body = categories;
  });

module.exports = router;
