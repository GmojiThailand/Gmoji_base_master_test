db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.price_without_margin': {
      'type': 'number',
      'name': 'price_without_margin'
    },
  }
});
