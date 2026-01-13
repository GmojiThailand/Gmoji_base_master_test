module.exports = {
  BearerToken: {
    type: 'object',
    description: 'Объект токена авторизации',
    properties: {
      'data': {
        type: 'object',
        schema: {
          type: 'object',
          properties: {
            'id': {
              type: 'string',
              description: 'Системный id авторизовавшегося юзера',
            },
          }
        },
      },
      'role': {
        type: 'string',
        description: 'Системный id роли авторизовавшегося юзера',
      },
      'token': {
        type: 'object',
        schema: {
          type: 'object',
          title: 'Token',
          description: 'Объект с информацией о токене авторизации',
          properties: {
            'token_type': {
              type: 'string',
              description: 'Тип токена авторизации в системе',
            },
            'access_token': {
              type: 'string',
              description: 'Токен авторизации юзера',
            },
            'expires_in': {
              type: 'number',
              description: 'Время действия токена авторизации до истечения в UNIX Timestamp',
            },
            'refresh_token': {
              type: 'string',
              description: 'Токен для обновления токена авторизации юзера',
            },
            'user_id': {
              type: 'string',
              description: 'Системный id авторизовавшегося юзера',
            },
          }
        },
      },
    },
    example: {
      'data': {
        'id':'5979877576b74414134c2ee1'
      },
      'role': '58808abccf1f550f22a8c02a',
      'token': {
        'token_type': 'bearer',
        'access_token': 'ee2935bdf3e81fd052783c7d3ed813164350f097',
        'expires_in': 86400,
        'refresh_token': '58e3057ec330080d7732dc982e9bd8cd76673f02',
        'user_id': '5979877576b74414134c2ee1'
      }
    },
  },
};
