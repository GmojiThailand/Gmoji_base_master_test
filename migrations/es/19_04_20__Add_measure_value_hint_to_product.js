db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.localized_value': {
      'type': 'object',
      'name': 'localized_value'
    },
    'options.fields.localized_value_hint': {
      'type': 'object',
      'name': 'localized_value_hint'
    }
  }
});