db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
    $set: {
        'options.fields.show_full_bold': {
            'type': 'boolean',
            'name': 'show_full_bold'
        }
    }
});