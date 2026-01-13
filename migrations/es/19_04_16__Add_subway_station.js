db = connect('localhost:27017/api-factory');

db.entities.save(
    {
        '_id': ObjectId('5cb484a6fb9f58d057a60713'),
        'name': 'subway_station',
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
                'color': {
                    'type': 'string',
                    'name': 'color'
                },
                'city_dict': {
                    'ref': '5c665b0c732141e61a9efe5c',
                    'populate': true,
                    'type': 'referer',
                    'name': 'city_dict'
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

db.entities.find({'name': 'subway_station'}).forEach(function (v) {
    db.createCollection('tableentity_' + v['_id'].str);
});

db.entities.update({'name': 'stores'}, {
    $set: {
        'options.fields.subway_stations': {
            'type': 'object',
            'name': 'subway_stations',
            'array': true
        },
        'options.fields.working_hours': {
            'type': 'string',
            'name': 'working_hours'
        },
        'options.fields.category': {
            'type': 'string',
            'name': 'category'
        }
    }
});

db.tableentity_5a95044e265be107208275c9.save(
    {
        'description': 'Добавить станцию метро',
        'route': '/create_subway_station',
        'role': ['58808abccf1f550f22a8c02a'],
        'is_editable': false,
        'is_real': true
    }
);
db.tableentity_5a95044e265be107208275c9.save(
    {
        'description': 'Редактировать станцию метро',
        'route': '/edit_subway_station',
        'role': ['58808abccf1f550f22a8c02a'],
        'is_editable': false,
        'is_real': true
    }
);
db.tableentity_5a95044e265be107208275c9.save(
    {
        'description': 'Удалить станцию метро',
        'route': '/delete_subway_station',
        'role': ['58808abccf1f550f22a8c02a'],
        'is_editable': false,
        'is_real': true
    }
);
db.tableentity_5a95044e265be107208275c9.save(
    {
        'description': 'Получить станцию метро по id',
        'route': '/get_subway_station',
        'role': ['58808abccf1f550f22a8c02a', '58b40f669154c320f9831bfa'],
        'is_editable': false,
        'is_real': true
    }
);
db.tableentity_5a95044e265be107208275c9.save(
    {
        'description': 'Получить список станций метро',
        'route': '/get_all_subway_stations',
        'role': ['58808abccf1f550f22a8c02a', '58b40f669154c320f9831bfa'],
        'is_editable': false,
        'is_real': true
    }
);


