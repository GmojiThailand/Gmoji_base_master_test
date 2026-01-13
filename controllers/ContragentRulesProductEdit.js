'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const RolesDictionary = require('../models/dictionaries/Role');

const router = new Router();

router.post('/contragent_rules_product_edit',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {create_product, edit_product, delete_product} = this.request.fields;

    const createProductRoute = '/create_product';
    const updateProductRoute = '/edit_product';
    const deleteProductRoute = '/soft_delete_products';

    const rulesTable = yield Table.fetch('rules', this.application.id);

    let createProductRule = yield rulesTable.find({route: createProductRoute});
    let updateProductRule = yield rulesTable.find({route: updateProductRoute});
    let deleteProductRule = yield rulesTable.find({route: deleteProductRoute});

    let result = {};
    if (create_product === true && !~createProductRule.data.role.indexOf(RolesDictionary.CONTRAGENT)) {
      createProductRule.data.role.push(RolesDictionary.CONTRAGENT);
      yield createProductRule.data.update({role: createProductRule.data.role});
      result.create_product = true;
    }

    if (create_product === false && ~createProductRule.data.role.indexOf(RolesDictionary.CONTRAGENT)) {
      let ind = createProductRule.data.role.indexOf(RolesDictionary.CONTRAGENT);
      createProductRule.data.role.splice(ind, 1);
      yield createProductRule.data.update({role: createProductRule.data.role});
      result.create_product = false;
    }


    if (edit_product === true && !~updateProductRule.data.role.indexOf(RolesDictionary.CONTRAGENT)) {
      updateProductRule.data.role.push(RolesDictionary.CONTRAGENT);
      yield updateProductRule.data.update({role: updateProductRule.data.role});
      result.edit_product = true;
    }

    if (edit_product === false && ~updateProductRule.data.role.indexOf(RolesDictionary.CONTRAGENT)) {
      let ind = updateProductRule.data.role.indexOf(RolesDictionary.CONTRAGENT);
      updateProductRule.data.role.splice(ind, 1);
      yield updateProductRule.data.update({role: updateProductRule.data.role});
      result.edit_product = false;
    }


    if (delete_product === true && !~deleteProductRule.data.role.indexOf(RolesDictionary.CONTRAGENT)) {
      deleteProductRule.data.role.push(RolesDictionary.CONTRAGENT);
      yield deleteProductRule.data.update({role: deleteProductRule.data.role});
      result.delete_product = true;
    }

    if (delete_product === false && ~deleteProductRule.data.role.indexOf(RolesDictionary.CONTRAGENT)) {
      let ind = deleteProductRule.data.role.indexOf(RolesDictionary.CONTRAGENT);
      deleteProductRule.data.role.splice(ind, 1);
      yield deleteProductRule.data.update({role: deleteProductRule.data.role});
      result.delete_product = false;
    }

    this.body = result;
  });

module.exports = router;
