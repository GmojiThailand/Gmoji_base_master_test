/*
 * Поиск сертификатов по условию с опциями
 *
 * @param {Object} application - объект с информацией о приложении Api Factory
 * @param {Object} options - входные параметры для поиска сертификатов
 *
 * @param {Object} params - условия поиска в таблице certificates
 * @param {Object} options - опции поиска в таблице certificates
 */
'use strict';

const Table = require('../Table');

exports.exec = function* (application, {params = {}, options = {}} = options) {
  const certificatesTable = yield Table.fetch('certificates', application.id);

  let certificates = yield certificatesTable.findAll(params, options);
  certificates = certificates.data;

  return certificates;
};
