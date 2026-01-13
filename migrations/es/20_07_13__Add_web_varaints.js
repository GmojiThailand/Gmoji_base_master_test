db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.web_variant': {
      'type': 'number',
      'name': 'web_variant'
    }
  }
});
