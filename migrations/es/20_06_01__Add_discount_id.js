db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.discount_id': {
      'type': 'string',
      'name': 'discount_id'
    },
    'options.fields.pay_id': {
      'type': 'string',
      'name': 'pay_id'
    }
  }
});

db.entities.update({'name': 'certificate_cashing'}, {
  $set: {
    'options.fields.raw_data': {
      'type': 'string',
      'name': 'raw_data'
    },
    'options.fields.raw_type': {
      'type': 'string',
      'name': 'raw_type'
    }
  }
});
