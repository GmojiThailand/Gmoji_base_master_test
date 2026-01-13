db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'product_instructions'}, {
  $set: {
    'options.fields.hide_numeration': {
      'type': 'boolean',
      'name': 'hide_numeration'
    }
  },
  $unset: {
    'options.fields.show_numeration': 1
  }
});
