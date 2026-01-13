db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'product_categories'}, {
  $set: {
    'options.fields.tint_icon': {
      'ref': '58b91e756521367de466f328',
      'populate': {'filter': '', 'select': ['image']},
      'type': 'referer',
      'name': 'tint_icon'
    }
  }
});