db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'city'}, {
  $set: {
    'options.fields.localized_name': {
      'type': 'object',
      'name': 'localized_name'
    },
    'options.fields.localized_short_name': {
      'type': 'object',
      'name': 'localized_short_name'
    }
  }
});