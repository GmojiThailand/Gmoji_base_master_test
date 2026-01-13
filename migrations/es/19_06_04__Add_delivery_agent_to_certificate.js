db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'certificates'}, {
  $set: {
    'options.fields.delivery_agent': {
      'ref': '5876419795ed3c0c59b14601',
      'populate': true,
      'type': 'referer',
      'name': 'delivery_agent'
    }
  }
});