db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.fiscalization': {
      'type': 'object',
      'name': 'fiscalization'
    }
  }
});
