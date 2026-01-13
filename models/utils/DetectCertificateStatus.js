/*
 * Определение типа сертификата
 *
 * @param {Object} certificate - сертификат для обработки
 *
 * Типы сертификатов товара:
 *
 * 0 - обычный сертификат без доставки(Обычный)
 * 1 - онлайн сертификат с купоном(Онлайн)
 * 2 - доставка по звонку контрагенту(Обычный + доставка)
 * 3 - доставка через заказ звонка в форме обратной связи(Запись)
 */
'use strict';

const HttpError = require('../Error');

exports.exec = function(certificate) {
  if (!certificate) {
    throw new HttpError(400, 'Certificate required');
  }

  if (!certificate.product) {
    Object.assign(certificate, {cashing_type: 0});
    return certificate;
  }

  let cashingType = 0;
  if (certificate.product.is_coupon_limited === true) {
    cashingType = 1;
  } else if (certificate.product.is_delivery === true) {
    if (certificate.product.delivery_type === true) {
      cashingType = 2;
    } else if (certificate.product.delivery_type === false) {
      cashingType = 3;
    }
  }
  Object.assign(certificate, {cashing_type: cashingType});

  return certificate;
};
