module.exports = {
  '/auth': {
    post: {
      tags: ['Authorization'],
      summary: 'Аутентификация мобильного пользователя',
      parameters: [
        {
          name: 'username',
          in: 'formData',
          type: 'string',
          required: true,
        },
        {
          name: 'Authorization',
          in: 'header',
          default: 'Basic ' + new Buffer('587640c995ed3c0c59b14600:88bf1cd70d').toString('base64'),
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
        '400': {
          description: 'Неверные параметры',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
  '/login': {
    post: {
      tags: ['Authorization'],
      summary: 'Авторизация мобильного пользователя',
      parameters: [
        {
          name: 'code',
          in: 'formData',
          type: 'string',
          required: true,
        },
        {
          name: 'sms_code',
          in: 'formData',
          type: 'string',
          required: true,
        },
        {
          name: 'Authorization',
          in: 'header',
          default: 'Basic ' + new Buffer('587640c995ed3c0c59b14600:88bf1cd70d').toString('base64'),
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
        '400': {
          description: 'Bad request!',
        },
        '400': {
          description: 'Sms code is invalid!',
        },
        '400': {
          description: 'Code is expired or invalid!',
        },
        '401': {
          description: 'Login failed!',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
  '/edit_profile': {
    post: {
      tags: ['Authorization'],
      summary: 'Редактирование профиля мобильного пользователя',
      parameters: [
        {
          name: 'user_id',
          in: 'formData',
          type: 'string',
          required: true,
        },
        {
          name: 'name',
          in: 'formData',
          type: 'string',
          required: false,
        },
        {
          name: 'email',
          in: 'formData',
          type: 'string',
          required: false,
        },
        {
          name: 'birthdate',
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
        '400': {
          description: 'Email already in use!',
        },
        '400': {
          description: 'Bad request!',
        },
        '404': {
          description: 'User not found!',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
  '/refresh': {
    post: {
      tags: ['Authorization'],
      summary: 'Получение токена авторизации по рефреш токену',
      parameters: [
        {
          name: 'refresh_token',
          in: 'formData',
          type: 'string',
          required: true,
        },
        {
          name: 'Authorization',
          in: 'header',
          default: 'Basic ' + new Buffer('587640c995ed3c0c59b14600:88bf1cd70d').toString('base64'),
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
        '400': {
          description: 'Bad request!',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
  '/login_administration': {
    post: {
      tags: ['Authorization'],
      summary: 'Аутентификация пользователя в административной панели',
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          default: 'Basic ' + new Buffer('587640c995ed3c0c59b14600:88bf1cd70d').toString('base64'),
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
          description: 'Объект с параметрами авторизации',
          required: true,
          schema: {
            type: 'object',
            properties: {
              'username': {
                type: 'string',
                description: 'Логин пользователя административной панели',
              },
              'password': {
                type: 'string',
                description: 'Пароль пользователя административной панели',
              },
            },
            required: [
              'username',
              'password',
            ],
            example: {
              'username': 'example@example.ru',
              'password': 'ExamplePassword',
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          schema: {
            $ref: '#/definitions/BearerToken',
          },
        },
        '400': {
          description: 'Неверные параметры',
        },
        '403': {
          description: '<число неудачных попыток авторизации>',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
  '/login_administration#subcontragent': {
    post: {
      tags: ['Authorization'],
      summary: 'Аутентификация представителя контрагента в административной панели',
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          default: 'Basic ' + new Buffer('587640c995ed3c0c59b14600:88bf1cd70d').toString('base64'),
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
          description: 'Объект с параметрами авторизации',
          required: true,
          schema: {
            type: 'object',
            properties: {
              'username': {
                type: 'string',
                description: 'Логин представителя контрагента в административной панели',
              },
              'is_subcontragent': {
                type: 'boolean',
                description: 'Флаг представителя контрагента в административной панели',
              },
            },
            required: [
              'username',
              'is_subcontragent',
            ],
            example: {
              'username': 'examplename',
              'is_subcontragent': true,
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          schema: {
            $ref: '#/definitions/BearerToken',
          },
        },
        '400': {
          description: 'Неверные параметры',
        },
        '403': {
          description: '<число неудачных попыток авторизации>',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
};
