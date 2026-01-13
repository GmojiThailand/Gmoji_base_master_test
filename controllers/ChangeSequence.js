/**
 * Изменение порядка вывода продуктов и категорий для пользователей приложения
 *
 * @param {string} table_name - название таблицы в котрой меняются позиции элементов
 * @param {number} old_position - старая позиция элемента в списке
 * @param {number} new_position - новая позиция элемента в списке
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const Locks = require('../models/Locks');
const HttpError = require('../models/Error');
const StatusesDictionary = require('../models/dictionaries/Status');

const router = new Router();

router.post('/change_sequence',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
      let fields = this.request.fields;

      let availableTables = ['product_categories', 'products'];

      if (!availableTables.includes(fields.table_name)) { throw new HttpError(400, 'Change not available for table'); }

      if (!fields.old_position || !fields.new_position || fields.old_position < 0 || fields.new_position < 0) {
          throw new HttpError(400, 'Incorrect request fields');
      }

      if (fields.new_position == fields.old_position) {
          return this.body = {
              data: 'OK',
          };
      }

      let min, max, k;
      if (fields.old_position > fields.new_position) {
          min = fields.new_position;
          max = fields.old_position;
          k = 1;
      } else {
          min = fields.old_position;
          max = fields.new_position;
          k = -1;
      }

      if (fields.table_name === 'product_categories') {
          const categoriesTable = yield Table.fetch('product_categories', this.application.id);

          let options = {
              select: ['id', 'fake_id', 'name'],
              sort: 'fake_id name'
          };

          let categories = yield categoriesTable.findAll({ status: StatusesDictionary.ACTIVE }, options)
              .catch((err) => ({data: null}));
          categories = categories.data;

          if (!categories) { throw new HttpError(404, 'Element not found'); }

          for (let idxn = 1; idxn <= categories.length; idxn++) {
              let v = categories[idxn - 1];
              let sort = idxn;
              if (idxn == fields.old_position) {
                  sort = fields.new_position;
              } else if (idxn >= min && idxn <= max) {
                  sort = idxn + k;
              }
              try {
                  Locks.isLocked([v.id]);
                  Locks.lock([v.id]);

                  let updElement = yield categoriesTable.findOneAndUpdate({id: v.id}, {fake_id: sort})
                      .catch((err) => ({data: null}));
                  updElement = updElement.data;

                  if (!updElement) { throw new HttpError(404, 'Element not found'); }
                  Locks.unlock([v.id]);
              } catch (error) {
                  Locks.unlock([v.id]);
                  throw error;
              }
          }
      } else if (fields.table_name === 'products') {
          // !!! swagger
          if (!fields.category_id) { throw new HttpError(400, 'Category id not found'); }

          let options = {
              select: ['id', 'fake_id', 'name'],
              sort: 'fake_id.' + fields.category_id + ' name'
          };

          let filter = {
              categories: fields.category_id,
              status: StatusesDictionary.ACTIVE
          };

          const productsTable = yield Table.fetch('products', this.application.id);
          let products = yield productsTable.findAll(filter, options)
              .catch((err) => ({data: null}));
          products = products.data;

          for (let idxn = 1; idxn <= products.length; idxn++) {
              let v = products[idxn - 1];
              let sort = idxn;
              if (idxn == fields.old_position) {
                  sort = fields.new_position;
              } else if (idxn >= min && idxn <= max) {
                  sort = idxn + k;
              }
              try {
                  Locks.isLocked([v.id]);
                  Locks.lock([v.id]);

                  let updElement = yield productsTable.findOneAndUpdate({id: v.id}, {[`fake_id.${fields.category_id}`]: sort})
                      .catch((err) => ({data: null}));
                  updElement = updElement.data;

                  if (!updElement) { throw new HttpError(404, 'Element not found'); }
                  Locks.unlock([v.id]);
              } catch (error) {
                  Locks.unlock([v.id]);
                  throw error;
              }
          }
      }

      return this.body = {
          data: 'OK',
      };
  });

module.exports = router;
