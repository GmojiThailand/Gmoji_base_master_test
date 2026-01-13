'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');

const router = new Router();

router.post('/get_admin_logs',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* (next) {
    let {sort, page, limit, start_creation_date, end_creation_date, user_id} = this.request.fields;

    if (!start_creation_date || !end_creation_date) { throw new HttpError(400, 'Incorrect request fields'); }

    delete this.request.fields.sort;
    delete this.request.fields.page;
    delete this.request.fields.limit;
    delete this.request.fields.start_creation_date;
    delete this.request.fields.end_creation_date;
    delete this.request.fields.user_id;

    let params = {
      $and: [
        {createdAt: {$gte: start_creation_date}},
        {createdAt: {$lt: end_creation_date}},
      ],
    };
    if (user_id) { params.user_id = user_id; }

    let options = {};
    if (sort) { options.sort = sort; }
    if (page) { options.page = page; }
    if (limit) { options.limit = limit; }

    const administrationLogsTable = yield Table.fetch('administration_logs', this.application.id);
    let logData = yield administrationLogsTable.findAll(params, options);

    const entityIds = {
      productIds: [],
      productCategoriesIds: [],
      contragentsId: [],
      storesIds: [],
      certificatesIds: [],
      adminsIds: [],
    };

    logData.data.map((log) => {
      entityIds.adminsIds.push(log.user_id);
      switch (log.table_name) {
        case 'stores':
          entityIds.storesIds.push(log.entity_id);
          break;

        case 'contragents':
          entityIds.contragentsId.push(log.entity_id);
          break;

        case 'products':
          entityIds.productIds.push(log.entity_id);
          break;

        case 'product_categories':
          entityIds.productCategoriesIds.push(log.entity_id);
          break;

        case 'certificates':
          entityIds.certificatesIds.push(log.entity_id);
          break;
      }
    });

    const administratorsTable = yield Table.fetch('administrators', this.application.id);

    const productsTable = yield Table.fetch('products', this.application.id);
    const productCategoriesTable = yield Table.fetch('product_categories', this.application.id);
    const contragentsTable = yield Table.fetch('contragents', this.application.id);
    const storesTable = yield Table.fetch('stores', this.application.id);
    const certificatesTable = yield Table.fetch('certificates', this.application.id);

    let admins = yield administratorsTable.findAll({user_id: {$in: entityIds.adminsIds}});

    let products = yield productsTable.findAll({id: {$in: entityIds.productIds}});
    let productCategories = yield productCategoriesTable.findAll({id: {$in: entityIds.productCategoriesIds}});
    let contragents = yield contragentsTable.findAll({id: {$in: entityIds.contragentsId}});
    let stores = yield storesTable.findAll({id: {$in: entityIds.storesIds}});
    let certificates = yield certificatesTable.findAll({id: {$in: entityIds.certificatesIds}});


    logData.data.map((log) => {
      let ind;
      ind = admins.data.findIndex((elem) => {
        return log.user_id == elem.user_id;
      });
      log.admin = admins.data[ind];
      delete log.user_id;

      switch (log.table_name) {
        case 'stores':
          ind = stores.data.findIndex((elem) => {
            return log.entity_id == elem.id;
          });
          log.store = stores.data[ind];
          delete log.entity_id;
          break;

        case 'contragents':
          ind = contragents.data.findIndex((elem) => {
            return log.entity_id == elem.id;
          });
          log.contragent = contragents.data[ind];
          delete log.entity_id;
          break;

        case 'products':
          ind = products.data.findIndex((elem) => {
            return log.entity_id == elem.id;
          });
          log.product = products.data[ind];
          delete log.entity_id;
          break;

        case 'product_categories':
          ind = productCategories.data.findIndex((elem) => {
            return log.entity_id == elem.id;
          });
          log.product_category = productCategories.data[ind];
          delete log.entity_id;
          break;

        case 'certificates':
          ind = certificates.data.findIndex((elem) => {
            return log.entity_id == elem.id;
          });
          log.certificate = certificates.data[ind];
          delete log.entity_id;
          break;
      }
    });

    this.body = {
      data: logData.data,
    };
  });


module.exports = router;
