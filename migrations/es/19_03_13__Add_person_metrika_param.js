db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'users'}, {
    $set: {
        'options.fields.metrikaTrackId': {
            'type': 'string',
            'name': 'metrikaTrackId'
        }
    }
});
