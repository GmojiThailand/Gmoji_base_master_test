db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'contragents'}, {
  $set: {
    'options.fields.disable_delivery_sequence': {
      'type': 'boolean',
      'name': 'disable_delivery_sequence'
    }
  }
});
