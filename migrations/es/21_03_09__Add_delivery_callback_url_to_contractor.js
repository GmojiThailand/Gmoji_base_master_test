db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'contragents'}, {
  $set: {
    'options.fields.delivery_callback_url': {
      'type': 'string',
      'name': 'delivery_callback_url'
    },
    'options.fields.delivery_callback_token': {
      'type': 'string',
      'name': 'delivery_callback_token'
    },
  }
});
