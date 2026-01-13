/*
 * Поиск в истории оплаты сертификатов по условию с опциями
 *
 * @param {Object} application - объект с информацией о приложении Api Factory
 * @param {Object} options - входные параметры для поиска в истории оплаты сертификатов
 *
 * @param {Object} params - условия поиска в таблице payture_orders
 * @param {Object} options - опции поиска в таблице payture_orders
 */
'use strict';

const Table = require('../Table');

exports.exec = function* (application, {params = {}, options = {}} = options) {
  const ordersTable = yield Table.fetch('payture_orders', application.id);

  let orders = yield ordersTable.findAll(params, options);
  orders = orders.data;

  return orders;
};
