/*
 * Поиск контрагентов по условию с опциями
 *
 * @param {Object} application - объект с информацией о приложении Api Factory
 * @param {Object} options - входные параметры для поиска контрагентов
 *
 * @param {Object} params - условия поиска в таблице contragents
 * @param {Object} options - опции поиска в таблице contragents
 */
'use strict';

const Table = require('../Table');

exports.exec = function* (application, {params = {}, options = {}} = options) {
  const contragentsTable = yield Table.fetch('contragents', application.id);

  let contragents = yield contragentsTable.findAll(params, options);
  contragents = contragents.data;

  return contragents;
};
