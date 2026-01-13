db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'contragents'}, {
  $set: {
    'options.fields.commission_common': {
      'type': 'number',
      'name': 'commission_common'
    }
  }
});