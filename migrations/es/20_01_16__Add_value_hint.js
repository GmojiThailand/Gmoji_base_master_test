db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.value_hint': {
      'type': 'string',
      'name': 'value_hint'
    }
  }
});
