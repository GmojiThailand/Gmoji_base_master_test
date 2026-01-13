/*
 * Поиск лимитов по условию с опциями
 *
 * @param {Object} application - объект с информацией о приложении Api Factory
 * @param {Object} options - входные параметры для поиска лимитов
 *
 * @param {Object} params - условия поиска в таблице limits
 * @param {Object} options - опции поиска в таблице limits
 */
'use strict';

const Table = require('../Table');

exports.exec = function* (application, {params = {}, options = {}} = options) {
  const limitsTable = yield Table.fetch('limits', application.id);

  let limits = yield limitsTable.findAll(params, options);
  limits = limits.data;

  return limits;
};
