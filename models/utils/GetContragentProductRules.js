'use strict';

const Table = require('../Table');
const RolesDictionary = require('../dictionaries/Role');

exports.exec = function* (application) {
  const contragentRole = RolesDictionary.CONTRAGENT;
  const productRoutes = ['/create_product', '/edit_product', '/soft_delete_products'];

  const rulesTable = yield Table.fetch('rules', application.id);
  let productRules = yield rulesTable.findAll({route: {$in: productRoutes}});

  let result = {
    create_product: false,
    edit_product: false,
    delete_product: false,
  };

  // TODO: includes вместо indexOf
  productRules.data.map((rule) => {
    if (rule.route === '/create_product' && ~rule.role.indexOf(contragentRole)) {
      result.create_product = true;
    }
    if (rule.route === '/edit_product' && ~rule.role.indexOf(contragentRole)) {
      result.edit_product = true;
    }
    if (rule.route === '/soft_delete_products' && ~rule.role.indexOf(contragentRole)) {
      result.delete_product = true;
    }
  });


  return result;
};
