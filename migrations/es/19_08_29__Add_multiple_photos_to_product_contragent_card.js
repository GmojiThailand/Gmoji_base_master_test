db = connect('localhost:27017/api-factory');

db.entities.find({'name': 'products'}).forEach(function (v) {
  db.entities.update({'name': 'product_photo'}, {
    $set: {
      'options.fields.product_id': {
        'ref': v['_id'].str,
        'populate': false,
        'type': 'referer',
        'name': 'product_id'
      }
    }
  });
});

db.entities.find({'name': 'product_photo'}).forEach(function (v) {
  db.entities.update({'name': 'product_contragent_cards'}, {
    $set: {
      'options.fields.photos': {
        'ref': v['_id'].str,
        'populate': true,
        'type': 'referer',
        'name': 'photos',
        'array': true
      }
    }
  });
});