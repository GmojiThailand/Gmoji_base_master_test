db = connect('localhost:27017/api-factory');

db.entities.save(
    {
        '_id': ObjectId('5ce29cf6ba6554d5fe86163a'),
        'name': 'tag',
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
                'localized_name': {
                    'type': 'object',
                    'name': 'localized_name'
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

db.entities.find({'name': 'tag'}).forEach(function (v) {
    db.createCollection('tableentity_' + v['_id'].str);

    db.entities.update({'name': 'products'}, {
        $set: {
            'options.fields.tags': {
                'ref': v['_id'].str,
                'populate': true,
                'type': 'referer',
                'name': 'tags',
                'array': true
            },
            'options.fields.new': {
                'type': 'boolean',
                'name': 'new'
            },
            'options.fields.popular': {
                'type': 'integer',
                'name': 'popular'
            }
        }
    });
});

db.entities.update({'name': 'stores'}, {
    $set: {
        'options.fields.contragent_vending_id': {
            'type': 'string',
            'name': 'contragent_vending_id'
        }
    }
});

db.tableentity_5a95044e265be107208275c9.save(
    {
        'description': 'Добавить тег',
        'route': '/create_product_tag',
        'role': ['58808abccf1f550f22a8c02a'],
        'is_editable': false,
        'is_real': true
    }
);
db.tableentity_5a95044e265be107208275c9.save(
    {
        'description': 'Редактировать тег',
        'route': '/edit_product_tag',
        'role': ['58808abccf1f550f22a8c02a'],
        'is_editable': false,
        'is_real': true
    }
);
db.tableentity_5a95044e265be107208275c9.save(
    {
        'description': 'Удалить тег',
        'route': '/delete_product_tag',
        'role': ['58808abccf1f550f22a8c02a'],
        'is_editable': false,
        'is_real': true
    }
);
db.tableentity_5a95044e265be107208275c9.save(
    {
        'description': 'Получить тег по id',
        'route': '/get_product_tag',
        'role': ['58808abccf1f550f22a8c02a', '58b40f669154c320f9831bfa'],
        'is_editable': false,
        'is_real': true
    }
);
db.tableentity_5a95044e265be107208275c9.save(
    {
        'description': 'Получить список тегов',
        'route': '/get_all_product_tags',
        'role': ['58808abccf1f550f22a8c02a', '58b40f669154c320f9831bfa'],
        'is_editable': false,
        'is_real': true
    }
);
