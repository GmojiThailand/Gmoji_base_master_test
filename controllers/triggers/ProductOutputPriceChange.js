'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');

const router = new Router();

router.use('/product_output_price_change_trigger',
  {appId: true},
  function* () {
    const data = this.request.fields || this.request.querystring;

    if (!data || !data.data || !data.data.id || !data.data.output_price) {
      throw new HttpError(400, 'Incorrect data');
    }

    const outputPriceHistoryTable = yield Table.fetch('product_output_price_history', this.application.id);
    if (this.method == 'POST') {
      yield outputPriceHistoryTable.create({
        user_id: this.user.id,
        output_price: data.data.output_price,
        product_id: data.data.id,
      });
    } else if (this.method == 'PUT') {
      if (!data.newData || !data.newData.output_price) {
        throw new HttpError(400, 'Incorrect data');
      }

      if (data.newData.output_price == data.data.output_price) { return done(); }

      yield outputPriceHistoryTable.create({
        user_id: this.user.id,
        output_price: data.newData.output_price,
        product_id: data.data.id,
      });
    }

    return done();
  });
