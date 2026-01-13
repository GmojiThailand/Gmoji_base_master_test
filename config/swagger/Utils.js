module.exports = {
  '/change_sequence': {
    post: {
      tags: ['Utils'],
      summary: 'Изменение позиции элемента в списке',
      parameters: [
        {
          name: 'old_position',
          in: 'formData',
          type: 'number',
          required: true,
        },
        {
          name: 'new_position',
          in: 'formData',
          type: 'number',
          required: true,
        },
        {
          name: 'table_name',
          in: 'formData',
          type: 'string',
          required: true,
        },
        {
          name: 'category_id',
          in: 'formData',
          type: 'string',
          required: false,
        },
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
  '/check_unique_params': {
    post: {
      tags: ['Utils'],
      summary: 'Проверка уникальности логина или имени при создании новых пользователей',
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
          description: 'Объект с логином и/или именем пользователя для проверки',
          required: true,
          schema: {
            type: 'object',
            properties: {
              username: {
                type: 'string',
                description: 'Логин',
              },
              name: {
                type: 'string',
                description: 'Имя в профиле',
              },
            },
            required: [
              'username',
            ],
            example: {
              'username': 'example@example.com',
              'name': 'Example',
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
              username: {
                type: 'string',
                description: 'Логин',
              },
              name: {
                type: 'string',
                description: 'Имя в профиле',
              },
              checkUsername: {
                type: 'string',
                description: 'Статус проверки уникальности логина',
              },
              checkName: {
                type: 'string',
                description: 'Статус проверки уникальности имени',
              },
            },
            example: {
              'data': {
                'checkUsername': 'OK!',
                'checkName': 'OK!',
              },
            },
          },
        },
        '406': {
          description: 'Username already exists или Name already exists',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
};
