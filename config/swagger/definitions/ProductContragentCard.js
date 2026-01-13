module.exports = {
  ProductContragentCard: {
    type: 'object',
    description: 'Объект карты контрагента в продукте',
    properties: {
      'contragent_id': {
        type: 'string',
        description: 'Системный id контрагента',
      },
      'contragent_name': {
        type: 'string',
        description: 'Наименование контрагента',
      },
      'product_id': {
        type: 'string',
        description: 'Id продукта из таблицы products',
      },
      'commission_individual': {
        type: 'number',
        description: 'Коммиссия контрагента на продукт',
      },
      'product_name_aliase': {
        type: 'string',
        description: 'Индивидуальное наименование продукта для контрагента',
      },
      'stores': {
        type: 'array',
        description: 'Список торговых точек выдачи продукта',
        items: {
          $ref: '#/definitions/Store',
        },
      },
      'id': {
        type: 'string',
        description: 'Id карты контрагента в товаре из таблицы product_contragent_cards',
      },
    },
    example: {
      'contragent_id': '5a1bf228b6b7e15bf965239e',
      'contragent_name': 'Welcome to Russia',
      'product_id': '58da09095c7b2513f35c433c',
      'commission_individual': -1,
      'stores': ['598bffb947217f28ba69d016', '598c000e47217f28ba69d024', '598c008547217f28ba69d02c'],
      'product_name_aliase': 'Test Product Name Aliase',
      'id': '5a8e952254141a36a8daf839',
    },
  },
};
