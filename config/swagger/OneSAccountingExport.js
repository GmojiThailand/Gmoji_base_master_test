module.exports = {
  '/one_s_accounting_export#details': {
    post: {
      tags: ['1C Accounting Export'],
      summary: 'Выгрузка в 1С по ИНН контрагента',
      parameters: [
        {
          name: 'X-Api-Factory-Application-Id',
          in: 'header',
          default: '587640c995ed3c0c59b14600',
        },
        {
          name: 'body',
          in: 'body',
          type: 'string',
          description: 'Объект с ИНН контрагента и фильтрами выборки по дате',
          required: true,
          schema: {
            type: 'object',
            properties: {
              inn: {
                type: 'string',
                description: 'ИНН контрагента в системе',
              },
              api_key: {
                type: 'string',
                description: 'Ключ доступа к контроллеру',
              },
              details: {
                type: 'boolean',
                description: 'Флаг выгрузки детальной информации по Gpon\'ам',
              },
              begin_date: {
                type: 'number',
                description: '\'Дата с\' фильтра в формате UNIX Timestamp',
              },
              end_date: {
                type: 'number',
                description: '\'Дата по\' фильтра в формате UNIX Timestamp',
              },
            },
            required: [
              'inn',
              'api_key',
              'details',
            ],
            example: {
              'inn': '83816173234',
              'api_key': 'RE8gVSBLTk9XIERBIFdBWSBNWSBCUlVEREE=',
              'details': true,
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
              'contragent':{
                type: 'object',
                schema: {
                  type: 'object',
                  title: 'Contragent Meta',
                  properties: {
                    'name': {
                      type: 'string',
                      description: 'Наименование контрагента в системе'
                    },
                    'inn': {
                      type: 'string',
                      description: 'ИНН контрагента в системе'
                    },
                    'agent_contract_date': {
                      type: 'number',
                      description: 'Дата заключения контракта с контрагентом в формате UNIX Timestamp',
                    },
                    'agent_contract_number': {
                      type: 'string',
                      description: 'Номер контракта заключенного с контрагентом',
                    },
                  }
                }
              },
              'rows': {
                type: 'array',
                items: {
                  type: 'object',
                  title: 'Data Row',
                  properties: {
                    'cashing_date': {
                      type: 'number',
                      description: 'Дата гашения Gpon\'а в формате UNIX Timestamp',
                    },
                    'commission': {
                      type: 'number',
                      description: 'Размер коммиссии контрагента на Gpon',
                    },
                    'product_name': {
                      type: 'string',
                      description: 'Наименование товара персонально для контрагента',
                    },
                    'product_price': {
                      type: 'number',
                      description: 'Размер коммиссии персонально для контрагента',
                    },
                    'code': {
                      type: 'string',
                      description: 'Код Gpon\'а',
                    },
                  },
                }
              },
            },
            example: {
              'contragent':{
              'name': 'Welcome to Russia',
              'inn': '83816173234',
              'agent_contract_date': 1519848000000,
              'agent_contract_number': '831733'
              },
              'rows':[
                {
                  'cashing_date': 1507193048591,
                  'commission': 666,
                  'product_name': 'Icecream Card',
                  'product_price': 50,
                  'code': '150M-702A-702D-4659'
                },
              ],
            },
          }
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
  '/one_s_accounting_export': {
    post: {
      tags: ['1C Accounting Export'],
      summary: 'Выгрузка в 1С по ИНН контрагента',
      parameters: [
        {
          name: 'X-Api-Factory-Application-Id',
          in: 'header',
          default: '587640c995ed3c0c59b14600',
        },
        {
          name: 'body',
          in: 'body',
          type: 'string',
          description: 'Объект с ИНН контрагента и фильтрами выборки по дате',
          required: true,
          schema: {
            type: 'object',
            properties: {
              inn: {
                type: 'string',
                description: 'ИНН контрагента в системе',
              },
              api_key: {
                type: 'string',
                description: 'Ключ доступа к контроллеру',
              },
              begin_date: {
                type: 'number',
                description: '\'Дата с\' фильтра в формате UNIX Timestamp',
              },
              end_date: {
                type: 'number',
                description: '\'Дата по\' фильтра в формате UNIX Timestamp',
              },
            },
            required: [
              'inn',
              'api_key',
            ],
            example: {
              'inn': '83816173234',
              'api_key': 'RE8gVSBLTk9XIERBIFdBWSBNWSBCUlVEREE=',
              'begin_date': 1507887188309,
              'end_date': 1507887198401,
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
              'contragent':{
                type: 'object',
                schema: {
                  type: 'object',
                  title: 'Contragent Meta',
                  properties: {
                    'name': {
                      type: 'string',
                      description: 'Наименование контрагента в системе'
                    },
                    'inn': {
                      type: 'string',
                      description: 'ИНН контрагента в системе'
                    },
                    'agent_contract_date': {
                      type: 'number',
                      description: 'Дата заключения контракта с контрагентом в формате UNIX Timestamp',
                    },
                    'agent_contract_number': {
                      type: 'string',
                      description: 'Номер контракта заключенного с контрагентом',
                    },
                  }
                }
              },
              'rows': {
                type: 'array',
                items: {
                  type: 'object',
                  title: 'Data Row',
                  properties: {
                    'product_name': {
                      type: 'string',
                      description: 'Наименование товара персонально для контрагента',
                    },
                    'product_price': {
                      type: 'number',
                      description: 'Размер коммиссии персонально для контрагента',
                    },
                    'commission': {
                      type: 'number',
                      description: 'Размер коммиссии контрагента на Gpon',
                    },
                    'gpons_count': {
                      type: 'number',
                      description: 'Количество зарегистрированных гашения Gpon\'ов на товар',
                    },
                  },
                }
              },
            },
            example: {
              'contragent':{
              'name': 'Welcome to Russia',
              'inn': '83816173234',
              'agent_contract_date': 1519848000000,
              'agent_contract_number': '831733'
              },
              'rows':[
                {
                  'product_name': 'Chupa Chups Card',
                  'product_price': 1,
                  'commission': 13,
                  'gpons_count': 27
                },
              ],
            },
          }
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
};
