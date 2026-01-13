const Table = require('../Table');
const Validator = require('../Validator');
const StatusesDictionary = require('../dictionaries/Status');
const RolesDictionary = require('../dictionaries/Role');

exports.exec = function* (application, user, {fields} = options) {
  const cardsTable = yield Table.fetch('product_contragent_cards', application.id);
  const certificatesTable = yield Table.fetch('certificates', application.id);
  const cashingTable = yield Table.fetch('certificate_cashing', application.id);

  const options = {
    select: [
      'buy_date',
      'buyer_id',
      'code',
      'end_sale_date',
      'expiration_days',
      'order_id',
      'product',
      'status',
      'status_updated_at',
      'user_id',
    ],
  };

  if (fields.limit) { options.limit = fields.limit; }
  if (fields.page) { options.skip = fields.page * fields.limit || 0; }
  if (fields.sort) { options.sort = fields.sort; }

  let params = {};

  if (fields.end_sale_date) { params.end_sale_date = {$gt: fields.end_sale_date}; }
  if (fields.code) {
    let re = Validator.buildMongoRegex(fields.code, {});

    params.code = re;
  }

  if (user.role.id.toString() == RolesDictionary.CONTRAGENT) {
    let cashed = yield cashingTable.findAll({contragent_id: user.id.toString()});
    cashed = cashed.data;
    let cashedIds = cashed.map((item) => item.certificate_id);

    params.id = {$in: cashedIds};
    params.status = StatusesDictionary.SPENT;
  }

  const admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND, RolesDictionary.ADMIN_FIRST];

  if (~admins.indexOf(user.role.id.toString())) {
    params['$or'] = [
      {status: StatusesDictionary.OVERDUE},
    ];

    if (fields.contragent_id) {
      params.user_id = fields.contragent_id;

      // Create SPENT filter
      let cashed = yield cashingTable.findAll({contragent_id: fields.contragent_id});
      cashed = cashed.data;
      let cashedIds = cashed.map((item) => item.certificate_id);

      params['$or'].push({
        id: {$in: cashedIds},
        status: StatusesDictionary.SPENT,
      });

      // Create ACTIVE filter
      let cards = yield cardsTable.findAll({
        contragent_id: fields.contragent_id,
        status: StatusesDictionary.ACTIVE,
      });
      cards = cards.data;

      const productIds = cards.map((card) => card.product_id.toString());

      params['$or'].push({
        status: StatusesDictionary.ACTIVE,
        product: {$in: productIds},
      });
    } else {
      params['$or'].push({status: StatusesDictionary.ACTIVE}, {status: StatusesDictionary.SPENT});
    }
  }

  let certificates = yield certificatesTable.findAll(params, options);
  certificates = certificates.data;

  return certificates;
};
