db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'stores'}, {
  $set: {
    'options.fields.delivery_terminal_ids': {
      'array': true,
      'type': 'string',
      'name': 'delivery_terminal_ids'
    }
  }
});