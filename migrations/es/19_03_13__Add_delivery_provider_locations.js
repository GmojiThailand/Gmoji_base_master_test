db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
    $set: {
        'options.fields.external_ids': { "type" : "object", "name" : "external_ids", "default" : { }}
    }
});

db.entities.update({'name': 'certificates'}, {
    $set: {
        'options.fields.delivery_request_state': { "type" : "string", "name" : "delivery_request_state"},
        'options.fields.delivery_request_trn': { "type" : "string", "name" : "delivery_request_trn"}
    }
});

db.entities.save(
    {
        '_id': ObjectId('5c89032f78854aee26df1355'),
        'name': 'delivery_provider_city',
        'type': 'Table',
        'options': {
            'triggers': [],
            'params': {'timestamps': true},
            'rules': {
                'public': {'access': []},
                'all': {'access': ['list', 'view'], 'filter': {'status': '598d9bac47217f28ba69e0f5'}}
            },
            'fields': {
                'provider': {
                    'type': 'string',
                    'name': 'provider'
                },
                'city': {
                    'type': 'string',
                    'name': 'provider'
                },
                "street": {
                    "array": false,
                    "type": "string",
                    "name": "street"
                }
            },
            'adapter': 'MongoDB',
            'indexes': ''
        },
        'application': ObjectId('587640c995ed3c0c59b14600')
    }
);