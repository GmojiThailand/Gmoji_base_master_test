db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'payture_orders'}, {
    $set: {
        'options.fields.promo_partner': {
            'type': 'string',
            'name': 'promo_partner'
        }
    }
});

db.entities.update({'name': 'products'}, {
    $unset: {
        'options.fields.delivery_provider': ''
    }
});

db.tableentity_58973d924802c138d75d91e6.update({}, {
    $unset: {
        'delivery_provider': ''
    }
}, {multi: true});

db.entities.update({'name': 'contragents'}, {
    $set: {
        'options.fields.delivery_provider': {
            'type': 'string',
            'name': 'delivery_provider'
        }
    }
});

db.entities.update({'name': 'gift_promo_rule'}, {
    $set: {
        'options.fields.category': {
            'ref': '587641dd95ed3c0c59b14604',
            'populate': true,
            'type': 'referer',
            'name': 'category'
        }
    }
});