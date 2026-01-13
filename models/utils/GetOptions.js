/*
 * Copyright (c) E-System LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Written by E-System team (https://ext-system.com), 2019
 */

exports.exec = function* (fields) {
    let {sort, page, offset, limit, populate, select} = fields;

    let options = {};

    if (select) {
        options.select = select;
    }

    if (limit) {
        limit = parseInt(limit);
        page = page ? parseInt(page) : 0;
        let skip = parseInt(offset) || page * limit;
        Object.assign(options, {skip, limit});
    }

    if (sort) {
        Object.keys(sort).map((k) => sort[k] = parseInt(sort[k]));
        options.sort = sort;
    }

    if (populate) { options.populate = populate; }
    return options;
};
