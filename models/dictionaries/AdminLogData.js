'use strict';

let adminLogData = getAdminLogData();

function getAdminLogData(string) {
  return {
    LOG_TABLE: {
      PRODUCT: 'product',
      PRODUCT_CATEGORY: 'product_categories',
      CONTRAGENT: 'contragents',
      STORE: 'stores',
      CERTIFICATE: 'certificates',
      PRODUCT_CONTRAGENT_CARD: 'product_contragent_card',
      PRODUCT_STORE_CARD: 'product_store_card',
      LIMIT: 'limit',
    },
    LOG_OPERATION: {
      CREATE: 'create',
      UPDATE: 'update',
      DELETE: 'delete',
      CASH: 'cash',
    },
  };
};

module.exports = adminLogData;
