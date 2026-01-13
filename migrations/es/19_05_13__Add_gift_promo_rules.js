db = connect('localhost:27017/api-factory');

db.entities.save(
    {
        '_id': ObjectId('5ce29cf07101ae7e39bcc4f7'),
        'name': 'gift_promo_rule',
        'type': 'Table',
        'options': {
            'triggers': [],
            'params': {'timestamps': true},
            'rules': {
                'public': {'access': []},
                'all': {'access': ['list', 'view'], 'filter': {'status': '598d9bac47217f28ba69e0f5'}}
            },
            'fields': {
                'name': {
                    'type': 'string',
                    'name': 'name'
                },
                'code': {
                    'type': 'string',
                    'name': 'code'
                },
                'product': {
                    'ref': '58973d924802c138d75d91e6',
                    'populate': true,
                    'type': 'referer',
                    'name': 'product'
                },
                'using_limit': {
                    'type': 'number',
                    'using_limit': 'using_limit'
                },
                'expire_date': {
                    'type': 'date',
                    'using_limit': 'expire_date'
                },
                'status': {
                    'ref': '598d9a4747217f28ba69e0f3',
                    'required': true,
                    'populate': {'filter': '', 'select': []},
                    'type': 'referer',
                    'name': 'status'
                }
            },
            'adapter': 'MongoDB',
            'indexes': ''
        },
        'application': ObjectId('587640c995ed3c0c59b14600')
    }
);

db.entities.find({'name': 'gift_promo_rule'}).forEach(function (v) {
    db.createCollection('tableentity_' + v['_id'].str);

    db.entities.save(
        {
            '_id': ObjectId('5ce29cf07101ae7e39bcc4f8'),
            'name': 'gift_promo_history',
            'type': 'Table',
            'options': {
                'triggers': [],
                'params': {'timestamps': true},
                'rules': {
                    'public': {'access': []},
                    'all': {'access': ['list', 'view'], 'filter': {'status': '598d9bac47217f28ba69e0f5'}}
                },
                'fields': {
                    'promo': {
                        'ref': v['_id'].str,
                        'populate': true,
                        'type': 'referer',
                        'name': 'promo'
                    },
                    'user': {
                        'ref': '587641b195ed3c0c59b14602',
                        'populate': true,
                        'type': 'referer',
                        'name': 'user'
                    },
                    'use_date': {
                        'type': 'date',
                        'using_limit': 'use_date'
                    },
                    'status': {
                        'ref': '598d9a4747217f28ba69e0f3',
                        'required': true,
                        'populate': {'filter': '', 'select': []},
                        'type': 'referer',
                        'name': 'status'
                    }
                },
                'adapter': 'MongoDB',
                'indexes': ''
            },
            'application': ObjectId('587640c995ed3c0c59b14600')
        }
    );

    db.entities.find({'name': 'gift_promo_history'}).forEach(function (e) {
        db.createCollection('tableentity_' + e['_id'].str);
    });
});

