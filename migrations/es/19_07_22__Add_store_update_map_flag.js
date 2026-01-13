db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'stores'}, {
  $set: {
    'options.fields.update_map': {
      'type': 'boolean',
      'name': 'update_map'
    }
  }
});