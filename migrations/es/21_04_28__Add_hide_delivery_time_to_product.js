db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.hide_delivery_time': {
      'type': 'boolean',
      'name': 'hide_delivery_time'
    },
    'options.fields.price_cbs': {
      'type': 'number',
      'name': 'price_cbs'
    }
  }
});
