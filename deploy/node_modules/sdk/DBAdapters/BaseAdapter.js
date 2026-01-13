/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

class BaseAdapter {
  constructor(tableName, schema, options, application) {
    Object.assign(this, { tableName, schema, options, application });
    if (this.init) { this.init(); }
  }

  static init(tableName, schema, options, application) {
    return new this(tableName, schema, options, application);
  }

  toId() { throw new Error('Unsupport method'); }
  findAll() { throw new Error('Unsupport method'); }
  find() { throw new Error('Unsupport method'); }
  insert() { throw new Error('Unsupport method'); }
  update() { throw new Error('Unsupport method'); }
  remove() { throw new Error('Unsupport method'); }
}

module.exports = BaseAdapter;
