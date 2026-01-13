db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'contragents'}, {
  $set: {
    'options.fields.with_vat': {
      'type': 'boolean',
      'name': 'with_vat'
    },
  }
});
