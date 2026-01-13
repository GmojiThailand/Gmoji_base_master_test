db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
    $set: {
        'options.fields.showMap': {
            'type': 'boolean',
            'name': 'showMap'
        },
        'options.fields.showDelivery': {
            'type': 'boolean',
            'name': 'showDelivery'
        },
        'options.fields.showCopyButton': {
            'type': 'boolean',
            'name': 'showCopyButton'
        },
        'options.fields.showCallback': {
            'type': 'boolean',
            'name': 'showCallback'
        },
        'options.fields.codeType': {
            'type': 'string',
            'name': 'value'
        },
        'options.fields.multiPurchase': {
            'type': 'boolean',
            'name': 'multiPurchase'
        },
        'options.fields.sendPhoto': {
            'type': 'boolean',
            'name': 'sendPhoto'
        }
    },
    $unset: {
        'options.fields.isMultiPurchase': "",
        'options.fields.isSendPhoto': ""
    }
});

db.tableentity_58973d924802c138d75d91e6.find({isMultiPurchase: {$exists: true}}).forEach(function(v) {
    db.tableentity_58973d924802c138d75d91e6.update({_id: v._id}, {$set: {multiPurchase: v.isMultiPurchase}, $unset: {isMultiPurchase: ""}});
});

db.tableentity_58973d924802c138d75d91e6.find({isSendPhoto: {$exists: true}}).forEach(function(v) {
    db.tableentity_58973d924802c138d75d91e6.update({_id: v._id}, {$set: {sendPhoto: v.isSendPhoto}, $unset: {isSendPhoto: ""}});
});
