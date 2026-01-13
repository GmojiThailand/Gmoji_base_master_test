const Table = require('../Table');
const StatusesDictionary = require('../dictionaries/Status');
const HttpError = require('../Error');

exports.exec = function* (application, products, idCity) {
    if (!idCity) {
        return;
    }
    const cardsTable = yield Table.fetch('product_contragent_cards', application.id);
    const cards = yield cardsTable.findAll({
        product_id: products.map((product) => product.id.toString()),
        status: StatusesDictionary.ACTIVE,
    }).catch((e) => ({data: null}));

    if (cards && cards.data) {
        let storeMap = {};
        let storeIds = [];
        cards.data.forEach((v) => {
            if (!storeMap[v.product_id.toString()]) {
                storeMap[v.product_id.toString()] = [];
            }
            let ids = !v.stores ? [] : v.stores.map((pid) => pid.toString());
            storeMap[v.product_id.toString()] = storeMap[v.product_id.toString()].concat(ids);
            storeIds = storeIds.concat(ids);
        });
        for (var key in storeMap) {
            storeMap[key] = [...new Set(storeMap[key])];
        }
        storeIds = [...new Set(storeIds)];
        const storesTable = yield Table.fetch('stores', application.id);
        const stores = yield storesTable.findAll({
            id: storeIds,
            city_dict: idCity,
            status: StatusesDictionary.ACTIVE
        }).catch((e) => ({data: null}));

        if (stores && stores.data) {
            let aids = stores.data.map((s) => s.id.toString());
            for (var key in storeMap) {
                storeMap[key] = storeMap[key].filter((v, i) => aids.indexOf(v) !== -1);
            }
        }
        products.forEach((v) => {
            let id = v.id.toString();
            if (storeMap[id]) {
                v.quantity_places = v.item_type === 'ONLINE' ? 0 : storeMap[id].length;
            }
        });
    }
};