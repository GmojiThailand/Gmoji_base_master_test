'use strict';

const Table = require('../Table');
const StatusesDictionary = require('../dictionaries/Status');

exports.exec = function* (application, products, targets) {
    const productsTable = yield Table.fetch('products', application.id);
    const limitsTable = yield Table.fetch('limits', application.id);

    let ids = products.filter(v => v.use_denominations).map(v => v.id.toString());
    if (ids.length === 0) {
        return;
    }
    let denominations = yield productsTable.findAll({
        denomination_parent: ids,
        status: StatusesDictionary.ACTIVE,
        targets: {$in: targets},
        $and: [
            {contragent: {$nin: [null]}},
            {contragent: {$ne: []}},
            {contragent: {$exists: true}},
            {user_id: {$nin: [null]}},
            {user_id: {$ne: []}},
            {user_id: {$exists: true}},
            {hidden: {$ne: true}}
        ]
    }, {select: ['id', 'denomination_parent', 'output_price', 'old_price', 'denomination']});
    denominations = denominations.data;

    const denominationIds = denominations.map((product) => product.id.toString());

    let limitsData = yield limitsTable.findAll({product_id: {$in: denominationIds}});

    let limitValues = {};
    limitsData.data.forEach((limit) => {
        limitValues[limit.product_id] = limit.limit || 0;
    });

    let prices = {};
    let limits = {};
    let discounts = {};
    denominations.forEach((denomination) => {
        let key = denomination.denomination_parent;
        let limit = limitValues[denomination.id] || 0;
        if(limit < 1) {
            return;
        }
        limits[key] = (limits[key] || 0) + limit;

        if (denomination.old_price) {
            let discount = Math.round((denomination.old_price - denomination.output_price) / denomination.old_price * 100);
            if (!discounts[key] || discounts[key] < discount) {
                discounts[key] = discount;
            }
        }

        let value = denomination.denomination || denomination.output_price;

        if (!prices[key]) {
            prices[key] = {min: value, max: value};
        } else {
            if (prices[key].min > value) {
                prices[key].min = value;
            }
            if (prices[key].max < value) {
                prices[key].max = value;
            }
        }
    });

    products.filter(v => v.use_denominations).forEach((product) => {
        let price = prices[product.id];
        if (price) {
            product.output_price_from = price.min;
            product.output_price_to = price.max;
            product.denomination_from = price.min;
            product.denomination_to = price.max;
        }
        if (discounts[product.id]) {
            product.denomination_max_discount = discounts[product.id];
        }
        product.product_limit = limits[product.id] || 0;
    });
};
