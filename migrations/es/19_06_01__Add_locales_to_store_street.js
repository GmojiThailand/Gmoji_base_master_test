db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'stores'}, {
  $set: {
    'options.fields.localized_street': {
      'type': 'object',
      'name': 'localized_street'
    }
  }
});