/*
 * Поиск в истории гашения сертификатов по условию с опциями
 *
 * @param {Object} application - объект с информацией о приложении Api Factory
 * @param {Object} options - входные параметры для поиска в истории гашения сертификатов
 *
 * @param {Object} params - условия поиска в таблице certificate_cashing
 * @param {Object} options - опции поиска в таблице certificate_cashing
 */
'use strict';

const Table = require('../Table');

exports.exec = function* (application, {params = {}, options = {}} = options) {
  const cashingHistoryTable = yield Table.fetch('certificate_cashing', application.id);

  let cashingHistory = yield cashingHistoryTable.findAll(params, options);
  cashingHistory = cashingHistory.data;

  return cashingHistory;
};
