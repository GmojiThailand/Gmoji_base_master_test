db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'stores'}, {
  $set: {
    'options.fields.extraPoint1': {
      'type': 'string',
      'name': 'extraPoint1'
    }
  }
});
