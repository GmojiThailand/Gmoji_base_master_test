module.exports = {
  '/edit_profile_mobile': {
    post: {
      tags: ['Mobile'],
      summary: 'Изменение профиля мобильного пользователя',
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          default: 'Bearer ',
        },
        {
          name: 'X-Api-Factory-Application-Id',
          in: 'header',
          default: '587640c995ed3c0c59b14600',
        },
        {
          name: 'body',
          in: 'body',
          type: 'string',
          description: 'Объект с полями профиля мобильного пользователя',
          required: true,
          schema: {
            type: 'object',
            properties: {
              'email': {
                type: 'string',
                description: 'Email мобильного пользователя',
              },
              'name': {
                type: 'string',
                description: 'Имя мобильного пользователя',
              },
              'birthdate': {
                type: 'string',
                description: 'Дата рождения мобильного пользователя',
              },
              'sex': {
                type: 'string',
                description: 'Пол мобильного пользователя',
              },
              'city': {
                type: 'string',
                description: 'Город пребывания мобильного пользователя',
              },
            },
            example: {
              'email': 'example@example.ru',
              'name': 'Testname',
              'birthday': 824760000000,
              'sex': 'M',
              'city': 'Екатеринбург',
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
              'message': {
                type: 'string',
                description: 'Сообщение об успешном обновлении профиля мобильного пользователя',
              },
              'statusCode': {
                type: 'number',
                description: 'Статус успешного обновления профиля мобильного пользователя',
              },
            },
            example: {
              'message': 'Profile successfully updated',
              'statusCode': 200,
            },
          },
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
  // TODO: Заполнить роут
  '/contragents_by_product': {
    post: {
      tags: ['Mobile'],
      summary: 'Выгрузка контрагентов по id продукта',
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          default: 'Bearer ',
        },
        {
          name: 'X-Api-Factory-Application-Id',
          in: 'header',
          default: '587640c995ed3c0c59b14600',
        },
        {
          name: 'body',
          in: 'body',
          type: 'string',
          description: 'Объект с id продукта',
          required: true,
          schema: {
            type: 'object',
            properties: {
              'product_id': {
                type: 'string',
                description: 'Id продукта из таблицы stores',
              },
            },
            example: {
              'id': '58da09095c7b2513f35c433c',
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
};
