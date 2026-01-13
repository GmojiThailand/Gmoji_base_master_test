module.exports = {
  '/contragent_card_stores': {
    post: {
      tags: ['Product Contragent Card'],
      summary: 'Выгрузка списка активных торговых точек контрагента при создании карточки',
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          default: 'Bearer ',
          type: 'string',
          required: true,
        },
        {
          name: 'X-Api-Factory-Application-Id',
          in: 'header',
          type: 'string',
          default: '587640c995ed3c0c59b14600',
          required: true,
        },
        {
          name: 'body',
          in: 'body',
          type: 'string',
          description: 'Объект с системным id контрагента',
          required: true,
          schema: {
            type: 'object',
            properties: {
              'contragent_id': {
                type: 'string',
                description: 'Системный id контрагента',
              },
            },
            required: [
              'contragent_id',
            ],
            example: {
              'contragent_id': '5a1bf228b6b7e15bf965239e',
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          schema: {
            type: 'object',
            properties: {
              'fields': {
                type: 'object',
                description: 'Описание полей таблицы торговых точек',
              },
              'count': {
                type: 'number',
                description: 'Общее число найденных объектов торговых точек',
              },
              'data': {
                type: 'array',
                items: {
                  $ref: '#/definitions/Store',
                },
              },
            },
            example: {
              'fields': {'...': '...'},
              'count': 1,
              'data': [
                {
                  'updatedAt': 1507887188309,
                  'createdAt': 1502258868303,
                  'name': 'Barbershop ЦЕХ1',
                  'email': 'info@barberceh.ru',
                  'geo': [54.1546028, 48.385275200000024],
                  'contragent': '598aa3c747217f28ba69b59e',
                  'user_id': '598aa3c747217f28ba69b59d',
                  'phone': '+7 (965) 623-62-32',
                  'status': {
                    'name_en': 'active',
                    'name': 'Активен',
                    'id': '598d9bac47217f28ba69e0f5',
                  },
                  'building': '4',
                  'street': 'ул. Мира',
                  'city': 'Ульяновск',
                  'id': '598aa6b447217f28ba69b5fb',
                },
              ],
            },
          },
        },
        '406': {
          description: 'Contragent id required',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
  '/get_product_contragent_cards': {
    post: {
      tags: ['Product Contragent Card'],
      summary: 'Выгрузка списка карт контрагентов для товара',
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          default: 'Bearer ',
          type: 'string',
          required: true,
        },
        {
          name: 'X-Api-Factory-Application-Id',
          in: 'header',
          type: 'string',
          default: '587640c995ed3c0c59b14600',
          required: true,
        },
        {
          name: 'body',
          in: 'body',
          type: 'string',
          description: 'Объект с id продукта из таблицы products',
          required: true,
          schema: {
            type: 'object',
            properties: {
              'product_id': {
                type: 'string',
                description: 'Id продукта',
              },
            },
            required: [
              'product_id',
            ],
            example: {
              'product_id': '58da09095c7b2513f35c433c',
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          schema: {
            type: 'array',
            items: {
              $ref: '#/definitions/ProductContragentCard',
            },
            example: [
              {
                'contragent_id': '5954dd543530f23550bb5632',
                'contragent_name': 'Welcome to Russia',
                'product_id': {
                  'name': 'Чупачупс XXL',
                  'description': 'Chupa Chups XXL 4D - самая большая карамель на палочке с жевательной резинкой.',
                  'id': '58da09095c7b2513f35c433c',
                },
                'commission_individual': -1,
                'product_name_aliase': 'Test Product Name Aliase',
                'stores': [
                  {'...': '...'},
                  {'...': '...'},
                ],
                'id': '5a8e952254141a36a8daf839',
              },
            ],
          },
        },
        '406': {
          description: 'Product id required',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
  '/create_product_contragent_card': {
    post: {
      tags: ['Product Contragent Card'],
      summary: 'Создание карты контрагента товара',
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          default: 'Bearer ',
          type: 'string',
          required: true,
        },
        {
          name: 'X-Api-Factory-Application-Id',
          in: 'header',
          type: 'string',
          default: '587640c995ed3c0c59b14600',
          required: true,
        },
        {
          name: 'body',
          in: 'body',
          type: 'string',
          description: 'Объект с полями карты контрагента в товаре',
          required: true,
          schema: {
            type: 'object',
            properties: {
              'contragent_id': {
                type: 'string',
                description: 'Системный id контрагента',
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
                  type: 'object',
                  description: 'Описание торговой точки выдачи продукта',
                },
              },
            },
            required: [
              'contragent_id',
              'product_id',
              'commission_individual',
            ],
            example: {
              'contragent_id': '5a1bf228b6b7e15bf965239e',
              'product_id': '58da09095c7b2513f35c433c',
              'commission_individual': -1,
              'stores': ['598bffb947217f28ba69d016', '598c000e47217f28ba69d024', '598c008547217f28ba69d02c'],
              'product_name_aliase': 'Test Product Name Aliase',
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          schema: {
            $ref: '#/definitions/ProductContragentCard',
          },
        },
        '406': {
          description: 'Incorrect request fields',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
  '/edit_product_contragent_card': {
    post: {
      tags: ['Product Contragent Card'],
      summary: 'Изменение карты контрагента товара',
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          default: 'Bearer ',
          type: 'string',
          required: true,
        },
        {
          name: 'X-Api-Factory-Application-Id',
          in: 'header',
          type: 'string',
          default: '587640c995ed3c0c59b14600',
          required: true,
        },
        {
          name: 'body',
          in: 'body',
          type: 'string',
          description: 'Объект с полями карты контрагента в товаре',
          required: true,
          schema: {
            type: 'object',
            properties: {
              'card_id': {
                type: 'string',
                description: 'Id карты контрагента в товаре из таблицы product_contragent_cards',
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
                  type: 'object',
                  description: 'Описание торговой точки выдачи продукта',
                },
              },
            },
            required: [
              'card_id',
              'commission_individual',
            ],
            example: {
              'card_id': '5a8e952254141a36a8daf839',
              'commission_individual': 3,
              'stores': ['598c008547217f28ba69d02c'],
              'product_name_aliase': 'Test Product Name Aliase Change',
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          schema: {
            $ref: '#/definitions/ProductContragentCard',
          },
        },
        '406': {
          description: 'Card id required',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
  '/delete_product_contragent_card': {
    post: {
      tags: ['Product Contragent Card'],
      summary: 'Удаление карты контрагента товара',
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          default: 'Bearer ',
          type: 'string',
          required: true,
        },
        {
          name: 'X-Api-Factory-Application-Id',
          in: 'header',
          type: 'string',
          default: '587640c995ed3c0c59b14600',
          required: true,
        },
        {
          name: 'body',
          in: 'body',
          type: 'string',
          description: 'Объект с id карты контрагента в товаре',
          required: true,
          schema: {
            type: 'object',
            properties: {
              'card_id': {
                type: 'string',
                description: 'Id карты контрагента в товаре из таблицы product_contragent_cards',
              },
            },
            required: [
              'card_id',
            ],
            example: {
              'card_id': '5a8e952254141a36a8daf839',
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
        '406': {
          description: 'Card id required',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
};
