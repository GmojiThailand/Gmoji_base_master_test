db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.delivery_delay': {
      'type': 'number',
      'name': 'delivery_delay'
    },
  }
});
