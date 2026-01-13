/**
 * Кейс заказ звонка
 *
 * @param contragent_id - id контрагента
 * @param product_id - id продукта
 * @param message - сообщение от пользователя
 * @param user_phone - телефон пользователя пользователя
 * @param certificate_id - id джипона - если его нет то @param certificate_code - code джипона
 * @param product_name - имя продукта
 *
 * Если вызов происходит с web-сертификата то
 * @param - user_name - Имя человека делающего заказ
 * @param - user_phone - телефон человека делающего заказ
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const User = require('../models/User');
const Validator = require('../models/Validator');
const Service = require('../models/Service');
const StatusesDictionary = require('../models/dictionaries/Status');

const Config = require('../config/general');

const validator = new Validator();

const router = new Router();

router.all('/delivery_service_web',
  {
    appId: true,
  },
  function* () {
    const fields = Object.assign(this.request.fields || {}, this.request.query || {});

    console.log("Delivery web request", fields);

    validator.setRequiredFields([
      'product_id',
      'user_name',
      'user_phone',
      'message',
    ]);

    validator.checkRequiredFields(fields);

    if(!fields.agent && !fields.contragent_id) {
        throw new HttpError(400, 'Incorrect request fields - agent or contragent_id');
    }

    const contragentTable = yield Table.fetch('contragents', this.application.id);
    const productsTable = yield Table.fetch('products', this.application.id);

    let product = yield productsTable.find({id: fields.product_id})
      .catch((e) => ({data: null}));

    if (!product || !product.data) { throw new HttpError(404, 'Product not found'); }

    // call_back
    if (!(product.data.is_delivery && product.data.delivery_type === false)) {
      throw new HttpError(403, 'Product delivery disabled');
    }

    let userSys;
    // Обьект будет содержать все данные которые нужно будет по почте отправить
    let sendData = {};
    if (fields.message) { Object.assign(sendData, {message: fields.message}); }

    let contragent = null;
    if(fields.agent) {
        contragent = yield contragentTable.find({id: fields.agent})
            .catch((e) => ({data: null}));
    } else {
        contragent = yield contragentTable.find({user_id: fields.contragent_id})
            .catch((e) => ({data: null}));
    }

    if (!contragent || !contragent.data) { throw new HttpError(404, 'Contragent not found'); }

    if (!contragent.data.delivery_email) {
      userSys = yield User.find({id: contragent.data.user_id}, {}, this.application.id);
    }

    Object.assign(sendData, {userName: fields.user_name, userPhone: fields.user_phone});
    let sendEmail = contragent.data.delivery_email || userSys.username;

    let gpon = null;
    if (fields.certificate_id) {
      const certificatesTable = yield Table.fetch('certificates', this.application.id);
      gpon = yield certificatesTable.find({id: fields.certificate_id, status: StatusesDictionary.ACTIVE})
        .catch((e) => { throw new HttpError(404, 'Gpon not found'); });

      let deliveryRequest = JSON.parse(JSON.stringify(sendData));
      deliveryRequest.email = sendEmail;
      yield gpon.data.update({delivery_agent: contragent.data.id, delivery_request_date: Date.now(), delivery_request_processed: 0, delivery_request: JSON.stringify(deliveryRequest)});

      Object.assign(sendData, {gponCode: gpon.data.code, gponPin: gpon.data.pin, productName: gpon.data.product.name});

      const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
      let card = yield cardsTable.find({
          contragent_id: contragent.data.user_id,
          product_id: gpon.data.product.id,
          status: StatusesDictionary.ACTIVE
      }).catch((e) => ({data: null}));

      if(card && card.data && card.data.product_name_aliase) {
          sendData.productName = card.data.product_name_aliase;
      }

      if (gpon.data.product.localized_description) {
        if (fields.locale && gpon.data.product.localized_description[fields.locale]) {
            gpon.data.product.description = gpon.data.product.localized_description[fields.locale];
        } else if(gpon.data.product.localized_description[Config.defaultLocale]) {
            gpon.data.product.description = gpon.data.product.localized_description[Config.defaultLocale];
        }
      }
      sendData.productDescription = gpon.data.product.description;
    } else if (fields.certificate_code && fields.product_name) {
      Object.assign(sendData, {gponCode: fields.certificate_code, productName: fields.product_name});
    } else {
      throw new HttpError(400, 'Bad request');
    }

    const notify = yield Service.fetch('notify', this.application.id);
    notify.data = Object.assign(sendData, {to: [{email: sendEmail}]});

    yield notify.request('call_back', this);

    if (fields.certificate_id) {
        let to = sendData.userPhone.replace(/\D/g,'');
        notify.data = {to: [{number: to}], gponCode: gpon.data.code, gponPin: gpon.data.pin, productName: gpon.data.product.name};
        try {
            yield notify.request('sms_delivery_pin', this);
        } catch (e) {
            console.error(e);
        }
    }

    this.body = {
      statusCode: 200,
      message: 'OK'
    };
  });

module.exports = router;
