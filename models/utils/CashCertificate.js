const Table = require('../Table');
const HttpError = require('../Error');
const StatusesDictionary = require('../dictionaries/Status');
const RolesDictionary = require('../dictionaries/Role');
const GetProductStoreCards = require('./GetProductStoreCards');

exports.exec = function* (application, user, {certificateId, storeId, pin, phone, rawData, rawType} = options) {
  if (!certificateId) { throw new HttpError(400, 'Certificate id required'); }

  const admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND, RolesDictionary.ADMIN_FIRST];

  const certificatesTable = yield Table.fetch('certificates', application.id);
  const certificateCashingTable = yield Table.fetch('certificate_cashing', application.id);
  const storesTable = yield Table.fetch('stores', application.id);

  let cashStory = {};
  if(!!phone) {
      cashStory.phone = phone;
  }

  let certificate;
  let filter = {
    id: certificateId,
    status: StatusesDictionary.ACTIVE,
  };

  let store = {};
  if (storeId) {
    store = yield storesTable.find({id: storeId, status: StatusesDictionary.ACTIVE})
      .catch((e) => ({data: null}));
    store = store.data;

    if (!store) { throw new HttpError(404, 'Store not found'); }
  }

  /**
   * Гашение контрагента
   */

  if (user.role.id.toString() == RolesDictionary.CONTRAGENT && pin) {
    if (!storeId) { throw new HttpError(400, 'Store id required'); }

    const contragentsTable = yield Table.fetch('contragents', application.id);

    let contragent = yield contragentsTable.find({user_id: user.id})
      .catch((e) => ({data: null}));
    contragent = contragent.data;

    if (!contragent) { throw new HttpError(404, 'Contragent not found'); }

    certificate = yield certificatesTable.find(filter)
      .catch((e) => ({data: null}));
    certificate = certificate.data;

    if (!certificate) { throw new HttpError(400, 'Gpon not found'); }

    Object.assign(cashStory, {
      product_id: certificate.product.id.toString(),
      contragent_id: user.id.toString(),
      certificate_id: certificate.id.toString(),
      cashing_place: storeId,
    });
  }

  /**
   * Гашение представителя контрагента
   */

  if (user.role.id.toString() == RolesDictionary.SUB_CONTRAGENT && pin) {
    const subcontragentsTable = yield Table.fetch('subcontragents', application.id);
    const cardsTable = yield Table.fetch('product_contragent_cards', application.id);

    let subcontragent = yield subcontragentsTable.find({user_id: user.id.toString()})
      .catch((e) => ({data: null}));
    subcontragent = subcontragent.data;

    if (!subcontragent) { throw new HttpError(404, 'Subcontragent not found'); }

    let contragentId = subcontragent.contragent_id;
    certificate = yield certificatesTable.find(filter)
      .catch((e) => ({data: null}));
    certificate = certificate.data;

    if (!certificate) { throw new HttpError(400, 'Gpon not found'); }

    let productId = certificate.product.id.toString();
    let card = yield cardsTable.find({
      product_id: productId,
      contragent_id: contragentId,
      status: StatusesDictionary.ACTIVE,
    })
      .catch((e) => ({data: null}));
    card = card.data;

    if (!card) {
      throw new HttpError(400, 'Subcontragent\'s contragent card not exist in certificate product');
    }

    card.stores = card.stores.map((v) => v.toString());
    if (!card.stores.includes(storeId)) {
      throw new HttpError(400, 'Store id does not fit certificate product');
    }

    Object.assign(cashStory, {
      product_id: certificate.product.id.toString(),
      subcontragent_id: subcontragent.user_id.toString(),
      contragent_id: subcontragent.contragent_id,
      certificate_id: certificate.id.toString(),
      cashing_place: storeId,
    });
  }

  /**
   * Гашение за админа
   */

  if (~admins.indexOf(user.role.id.toString()) && pin) {
    if (!storeId) { throw new HttpError(400, 'Store id required'); }

    certificate = yield certificatesTable.find(filter)
      .catch((e) => ({data: null}));
    certificate = certificate.data;

    if (!certificate) { throw new HttpError(400, 'Gpon not found'); }

    Object.assign(cashStory, {
      product_id: certificate.product.id.toString(),
      contragent_id: store.user_id,
      certificate_id: certificateId,
      cashing_place: storeId,
    });
  }

  // Проверка совпадения с введенным пином
  if (certificate && pin && certificate.pin != pin) {
    return false;
  }

  const paytureOrdersTable = yield Table.fetch('payture_orders', application.id);
  let payOrder = yield paytureOrdersTable.find({order_id: certificate.order_id})
    .catch((e) => ({data: null}));
  payOrder = payOrder.data;

  if (!payOrder) { throw new HttpError(404, 'Pay order not found'); }

  // Поиск карточек товаров в торговых точках
  let productName;
  let cashingPrice;
  if (storeId) {
    let productStoreCards = yield GetProductStoreCards.exec(
      application,
      {
        params: {
          store_id: storeId,
          product_id: certificate.product.id.toString(),
          status: StatusesDictionary.ACTIVE,
        },
      }
    );
    if (productStoreCards.length) {
      let storeCard = productStoreCards[0];

      if (storeCard) {
        productName = storeCard.product_name;
        cashingPrice = storeCard.product_price;
      }
    }
  }

  if (!cashingPrice) {
    cashingPrice = ((payOrder.amount || 0) / 100) + ((payOrder.bonus_amount || 0) / 100);
  }

  Object.assign(
    cashStory,
    {
      cashing_price: cashingPrice,
      cashing_name: productName,
    }
  );

  if(rawData) {
    cashStory.raw_data = rawData;
  }
  if(rawType) {
    cashStory.raw_type = rawType;
  }

  let result = yield certificate.update({status: StatusesDictionary.SPENT, deactivation_date: Date.now()});

  yield certificateCashingTable.create(cashStory);

  if (result.product) {
    result.product.name = cashStory.cashing_name;
    result.product.output_price = cashStory.cashing_price;
  }

  return result;
};
