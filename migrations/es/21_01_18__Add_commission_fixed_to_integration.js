db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'integration_replacement'}, {
  $set: {
    'options.fields.commission_fixed': {
      'type': 'number',
      'name': 'commission_fixed'
    }
  }
});
