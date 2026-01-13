db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'notify'}, {
    $set: {
        "options.routes.sms_delivery_pin": {
            "route": "sms",
            "method": "POST",
            "name": "sms_delivery_pin",
            "params": {
                "message": "Ваш пин-код (произнести оператору): {$gponPin}",
                "to": "{$to}"
            }
        }
    }
});
