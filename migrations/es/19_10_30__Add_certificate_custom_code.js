db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'certificates'}, {
    $set: {
        'options.fields.custom_code': {
            'type': 'string',
            'name': 'custom_code'
        }
    }
});