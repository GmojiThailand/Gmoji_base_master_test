db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.static_code': {
      'type': 'string',
      'name': 'static_code'
    },
  }
});
