db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.use_replacement_limit': {
      'type': 'boolean',
      'name': 'use_replacement_limit'
    }
  }
});
