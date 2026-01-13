db = connect('localhost:27017/api-factory');
db.entities.save(
    {
        '_id': ObjectId('5c665b0c732141e61a9efe5c'),
        'name': 'city',
        'type': 'Table',
        'options': {
            'triggers': [],
            'params': {'timestamps': true},
            'rules': {
                'public': {'access': []},
                'all': {'access': ['list', 'view'], 'filter': {'status': '598d9bac47217f28ba69e0f5'}}
            },
            'fields': {
                'sorting': {'type': 'integer', 'name': 'sorting'},
                'level': {'type': 'integer', 'name': 'level'},
                'main': {'type': 'boolean', 'name': 'main'},
                'popular': {'type': 'boolean', 'name': 'popular'},
                'timezone': {'type': 'integer', 'name': 'timezone'},
                'name': {'type': 'string', 'name': 'name'},
                'shortName': {'type': 'string', 'name': 'shortName'},
                'geo': {'type': 'geo', 'name': 'geo'},
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
db.createCollection('tableentity_5c665b0c732141e61a9efe5cs');

db.entities.find({'name': 'city'}).forEach(function (v) {
    db.entities.update({'name': 'city'}, {
        $set: {
            'options.fields.parent': {
                'ref': v['_id'].str,
                'populate': true,
                'type': 'referer',
                'name': 'parent'
            }
        }
    });
    db.entities.update({'name': 'users'}, {
        $set: {
            'options.fields.city_dict': {
                'ref': v['_id'].str,
                'populate': true,
                'type': 'referer',
                'name': 'city_dict'
            }
        }
    });
    db.entities.update({'name': 'contragents'}, {
        $set: {
            'options.fields.city_dict': {
                'ref': v['_id'].str,
                'populate': true,
                'type': 'referer',
                'name': 'city_dict'
            },
            'options.fields.fact_city_dict': {
                'ref': v['_id'].str,
                'populate': true,
                'type': 'referer',
                'name': 'fact_city_dict'
            },
            'options.fields.law_city_dict': {
                'ref': v['_id'].str,
                'populate': true,
                'type': 'referer',
                'name': 'law_city_dict'
            }
        }
    });
    db.entities.update({'name': 'stores'}, {
        $set: {
            'options.fields.city_dict': {
                'ref': v['_id'].str,
                'populate': true,
                'type': 'referer',
                'name': 'city_dict'
            }
        }
    });
    db.entities.update({'name': 'products'}, {
        $set: {
            'options.fields.cities': {
                'ref': v['_id'].str,
                'populate': true,
                'type': 'referer',
                'name': 'cities',
                array: true
            }
        }
    });
});

db.entities.update({'name': 'products'}, {$set: {'options.fields.itemType': {'type': 'string', 'name': 'itemType'}}});
db.entities.update({'name': 'product_categories'}, {$set: {'options.fields.main': {'type': 'boolean', 'name': 'main'}}});

db.entities.find({'name': 'stores'}).forEach(function (v) {
    var storeTable = 'tableentity_' + v['_id'].str;
    db[storeTable].createIndex({'stores': 1});
    db[storeTable].createIndex({'product_id': 1});
});

