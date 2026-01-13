db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.localized_description': {
      'type': 'object',
      'name': 'localized_description'
    }
  }
});