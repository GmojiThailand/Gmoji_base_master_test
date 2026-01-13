db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'product_instructions'}, {
  $set: {
    'options.fields.localized_items': {
      'type': 'object',
      'name': 'localized_items'
    }
  }
});
