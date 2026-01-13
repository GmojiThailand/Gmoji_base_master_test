/*
 * Copyright (c) E-System LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Written by E-System team (https://ext-system.com), 2019
 */

db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'certificates'}, {
    $set: {
        'options.fields.shown': {
            'type': 'boolean',
            'name': 'shown'
        }
    }
});