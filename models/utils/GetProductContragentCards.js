/*
 * Поиск карточек контрагентов в продукте по условию с опциями
 *
 * @param {Object} application - объект с информацией о приложении Api Factory
 * @param {Object} options - входные параметры для поиска карточек контрагентов
 *
 * @param {Object} params - условия поиска в таблице product_contragent_cards
 * @param {Object} options - опции поиска в таблице product_contragent_cards
 */
'use strict';

const Table = require('../Table');

exports.exec = function* (application, {params = {}, options = {}} = options) {
  const cardsTable = yield Table.fetch('product_contragent_cards', application.id);

  let cards = yield cardsTable.findAll(params, options);
  cards = cards.data;

  return cards;
};
