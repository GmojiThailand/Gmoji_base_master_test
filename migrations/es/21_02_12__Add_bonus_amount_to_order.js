db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'payture_orders'}, {
  $set: {
    'options.fields.bonus_amount': {
      'type': 'number',
      'name': 'bonus_amount'
    },
  }
});
