db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.denomination': {
      'type': 'number',
      'name': 'denomination'
    },
    'options.fields.price_business': {
      'type': 'number',
      'name': 'price_business'
    }
  }
});
