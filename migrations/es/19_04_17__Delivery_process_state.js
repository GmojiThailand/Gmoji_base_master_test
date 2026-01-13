db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'certificates'}, {
    $set: {
        'options.fields.delivery_request_processed': {
            'type': 'number',
            'name': 'delivery_request_processed'
        }
    }
});

db.tableentity_587641c295ed3c0c59b14603.update({delivery_request_processed: false}, {$set: {delivery_request_processed: 0}}, {multi: true});
db.tableentity_587641c295ed3c0c59b14603.update({delivery_request_processed: true}, {$set: {delivery_request_processed: 2}}, {multi: true});