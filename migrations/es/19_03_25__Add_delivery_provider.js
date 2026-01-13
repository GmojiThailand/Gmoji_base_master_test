db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
    $set: {
        'options.fields.delivery_provider': { "type" : "string", "name" : "delivery_provider"}
    }
});
