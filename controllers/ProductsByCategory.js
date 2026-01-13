/**
 * Подгрузка продуктов по категории, включая ТОП.
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

// TODO: Переделать на запрос к БД выбор id категории топ
const topCategoryId = '58e5f191d351f81cc3fa6a0a';

router.all('/products_by_category',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = Object.assign(this.request.fields || {}, this.request.query || {});

    let options = yield utils.getOptions(fields);

    if (!fields.category_id) {
      throw new HttpError(400, 'Incorrect request fields');
    }

    const admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND, RolesDictionary.ADMIN_FIRST];

    const productsTable = yield Table.fetch('products', this.application.id);
    const limitsTable = yield Table.fetch('limits', this.application.id);
    const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);

    let targets = (this.headers['app-targets'] || 'app').split(",").map(v => v.trim());
    let lastApp = this.headers['app-targets'] === 'app';

    // Получение категории "Топ" для мобильных юзеров отдельным алгоритмом
    if (this.user.role.id == RolesDictionary.USER && fields.category_id.toString() == topCategoryId) {
      if (fields.out === 'short') {
        options.select = ['id', 'name', 'output_price', 'icon', 'item_type', 'localized_name', 'old_price', 'is_new', 'show_new', 'use_denominations'];
        if (fields.category_id) {
          options.sort = 'fake_id.' + fields.category_id + ' name';
        }
      } else {
        Object.assign(options, {populate: ['categories']});
      }

      if (options.skip) {
        this.body = [];
        return;
      } else {
        options.limit = null;
      }

      let filter = {
        categories: topCategoryId,
        status: StatusesDictionary.ACTIVE,
        targets: {$in: targets},
        $and: [
          {contragent: {$nin: [null]}},
          {contragent: {$ne: []}},
          {contragent: {$exists: true}},
          {user_id: {$nin: [null]}},
          {user_id: {$ne: []}},
          {user_id: {$exists: true}},
          {hidden: {$ne: true}}
        ]
      };
      if (lastApp) {
          filter.$and.push({$or: [{denomination_parent: {$exists: false}}, {denomination_parent: null}]});
      } else {
          filter.use_denominations = {$ne: true};
      }
      if (fields.city_id) {
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

        filter.$or = [{item_type: 'ONLINE'}, {cities: {$in: cityIds}}];
      }

      let topProducts = yield productsTable.findAll(filter, options);

      const certificatesTable = yield Table.fetch('certificates', this.application.id);
      let buyedCertificates = yield certificatesTable.findAll(
        {buyer_id: this.user.id.toString()},
        {sort: {buy_date: -1}}
      );

      let products = [];
      buyedCertificates.data.map((certificate) => {
        if (certificate.product.status.id == StatusesDictionary.ACTIVE && certificate.product.categories && certificate.product.categories.length > 0) {
          if (fields.city_id && certificate.product.item_type != 'ONLINE' && (certificate.product.cities == null || certificate.product.cities.findIndex((v) => v.toString() == fields.city_id) == -1)) {
            return;
          }
          let ind = products.findIndex((prod) => certificate.product.id.toString() == prod.id.toString());

          if (ind == -1) {
            let prod = certificate.product;
            if (fields.out === 'short') {
              prod = {
                name: certificate.product.name,
                localized_name: certificate.product.localized_name,
                output_price: certificate.product.output_price,
                icon: certificate.product.icon,
                id: certificate.product.id
              };
            }
            if (certificate.product.hidden !== true) {
              products.push(prod);
            }
          }
        }
      });

      // products - уникальные продукты от купленных джипонов - в порядке купленных джипонов - самый свежий первый
      /**
       *  Сертификаты приходят по убыванию даты покупки. Первый цикл отбора выше
       *  составляет продукты в обратном порядке. Теперь нужно их ревертнуть
       */
      let result = [];
      if (products.length >= 20) {
        result = products.slice(0, 20);
      }

      if (products.length == 0) {
        result = [...topProducts.data];
      }

      if (products.length > 0 && products.length < 20) {
        products.reverse(); // делаем реверс, чтобы правильно расставить элементы в массив topProducts
        products.map((product) => {
          let ind = topProducts.data.findIndex((element) => element.id.toString() == product.id.toString());

          if (ind == -1) {
            if (topProducts.data.length == 20) {
              topProducts.data.pop();
            }
            topProducts.data.unshift(product);
          } else {
            topProducts.data.splice(ind, 1);
            topProducts.data.unshift(product);
          }
        });
        result = topProducts.data;
      }

      const productIds = result.map((product) => product.id.toString());
      let limits = yield limitsTable.findAll({product_id: {$in: productIds}});
      limits = limits.data;

      if (!limits) {
        throw new HttpError(404, 'Limit not found');
      }

      result = result.map((product) => {
        let match;
        limits.map((limit) => {
          if (limit.product_id.toString() == product.id.toString()) {
            match = limit;
          }
        });

        if (!match) {
          throw new HttpError(404, 'Limit not found');
        }

        product.product_limit = match.limit;
        return product;
      });

      const categoriesTable = yield Table.fetch('product_categories', this.application.id);
      let categories = yield categoriesTable.findAll({status: StatusesDictionary.ACTIVE});
      categories = categories.data;

      // Подстановка категорий в продукты
      result = result.map((product) => {
        let categoryArray = [];
        if (product.categories) {
          product.categories.map((category) => {
            categories.map((item) => {
              if (item.id.toString() == category.toString()) {
                categoryArray.push(item);
              }
            });
          });
        }
        product.categories = categoryArray;
        return product;
      });

      reformatProductNames(result);
      yield utils.updateProductPlaces(this.application, result, fields.city_id);
      yield utils.updateDenominations(this.application, result, targets);
      this.body = result;
      return;
    } else {
      if (fields.category_id) {
        options.sort = 'fake_id.' + fields.category_id + ' name';
      }
      if (fields.out === 'short') {
        options.select = ['id', 'name', 'output_price', 'icon', 'item_type', 'localized_name', 'old_price', 'is_new', 'show_new', 'show_delivery', 'use_denominations'];
      } else {
        options = Object.assign(options, {populate: ['contragent', 'categories']});
      }

      let filter = {
        categories: fields.category_id,
        status: StatusesDictionary.ACTIVE
      };

      if (~admins.indexOf(this.user.role.id.toString())) {
        // Поиск всех продуктов категории
        let products = yield productsTable.findAll(filter, options);
        products = products.data;

        reformatProductNames(products);
        yield utils.updateDenominations(this.application, products, targets);
        this.body = products;
        return;
      }

      if (this.user.role.id == RolesDictionary.CONTRAGENT) {
        // Поиск всех продуктов категории
        let categoryProducts = yield productsTable.findAll(filter);
        categoryProducts = categoryProducts.data;
        let categoryProductIds = categoryProducts.map((categoryProduct) => categoryProduct.id.toString());

        // Поиск карточек текущего контрагента на товары из категории
        let cards = yield cardsTable.findAll({
          product_id: categoryProductIds,
          contragent_id: this.user.id.toString(),
          status: StatusesDictionary.ACTIVE,
        });
        cards = cards.data;
        const productIds = cards.map((card) => card.product_id.toString());

        filter = {
          categories: fields.category_id,
          status: StatusesDictionary.ACTIVE,
          id: {$in: productIds},
        };
        if (fields.city_id) {
          filter.$or = [{item_type: 'ONLINE'}, {cities: fields.city_id}];
        }

        // Поиск в категории продуктов текущего контрагента
        let products = yield productsTable.findAll(filter, options);
        products = products.data;

        const categoriesTable = yield Table.fetch('product_categories', this.application.id);
        let categories = yield categoriesTable.findAll({status: StatusesDictionary.ACTIVE});
        categories = categories.data;

        products = products.map((product) => {
          if (product.categories) {
            let categoryArray = [];
            product.categories.map((category) => {
              categories.map((item) => {
                if (item.id.toString() == category.toString()) {
                  categoryArray.push(item);
                }
              });
            });

            product.categories = categoryArray;
          }

          return product;
        });

        reformatProductNames(products);
        yield utils.updateDenominations(this.application, products, targets);
        this.body = products;
        return;
      }

      if (this.user.role.id == RolesDictionary.USER) {
        if (fields.out !== 'short') {
          options.populate = ['categories'];
        }
        let params = {
          categories: fields.category_id,
          status: StatusesDictionary.ACTIVE,
          targets: {$in: targets},
          $and: [
            {contragent: {$nin: [null]}},
            {contragent: {$ne: []}},
            {contragent: {$exists: true}},
            {user_id: {$nin: [null]}},
            {user_id: {$ne: []}},
            {user_id: {$exists: true}},
            {hidden: {$ne: true}}
          ]
        };
          if (lastApp) {
              params.$and.push({$or: [{denomination_parent: {$exists: false}}, {denomination_parent: null}]});
          } else {
              params.use_denominations = {$ne: true};
          }
        if (fields.city_id) {
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

          params.$or = [
            {item_type: 'ONLINE'},
            {cities: {$in: cityIds}, item_type: {$ne: 'DELIVERY'}},
            {cities: fields.city_id, item_type: 'DELIVERY'}
          ];
          if(Array.isArray(Config.noOnlineFor) && Config.noOnlineFor.length > 0 && Config.noOnlineFor.includes(fields.city_id)) {
            params.item_type = {$ne: 'ONLINE'};
          }
        }

        let isAdult = yield utils.checkIsAdult(this.application, this.user);

        if (!isAdult) {
          Object.assign(params, {is_adult: false});
        }

        let products = yield productsTable.findAll(params, options);
        products = products.data;
        const productIds = products.map((product) => product.id.toString());

        let limits = yield limitsTable.findAll({product_id: {$in: productIds}});
        limits = limits.data;

        if (!limits) {
          throw new HttpError(404, 'Limit not found');
        }

        yield utils.updateProductPlaces(this.application, products, fields.city_id);

        products = products.map((product) => {
          let match;
          limits.map((limit) => {
            if (limit.product_id.toString() == product.id.toString()) {
              match = limit;
            }
          });

          if (!match) {
            throw new HttpError(404, 'Limit not found');
          }

          product.product_limit = match.limit;
          return product;
        });

        reformatProductNames(products);
        yield utils.updateDenominations(this.application, products, targets);
        this.body = products;
      }
    }

    function reformatProductNames(products) {
      products.forEach(function (product) {
        if (product.localized_name) {
          if (fields.locale && product.localized_name[fields.locale]) {
            product.name = product.localized_name[fields.locale];
          } else if (product.localized_name[Config.defaultLocale]) {
            product.name = product.localized_name[Config.defaultLocale];
          }
        }
      });
    }
  });

module.exports = router;
