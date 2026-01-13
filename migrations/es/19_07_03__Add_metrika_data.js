db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'users'}, {
  $set: {
    'options.fields.metrika_data':{ "type" : "object", "name" : "overrides", "default" : { }}
  }
});