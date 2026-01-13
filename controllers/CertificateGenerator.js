/**
 * Генерация информации по сертификату для веб-сервиса certificate-generator
 *
 * @param {string} certificate_id - id сертификата товара
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const HttpError = require('../models/Error');
const StatusesDictionary = require('../models/dictionaries/Status');

const utils = require('../models/utils');

const router = new Router();

const Config = require('../config/general');

router.all('/certificate_generator',
  {
    appId: true,
  },
  function* () {
    try {
      const fields = this.request.fields || this.request.query;

      let options = {};

      if (!fields.purpose) {
        fields.purpose = 'mobile';
      }
      fields.purpose = fields.purpose.toUpperCase();

      if (fields.out === 'short') {
        options.populate = {
          product: {
            select:
              [
                '_id', 'updatedAt', 'createdAt', 'order_id', 'output_price', 'old_price', 'description', 'is_delivery', 'delivery_type',
                'code_type', 'item_type', 'show_map', 'show_delivery', 'show_copy_button', 'show_callback', 'show_camera',
                'product_code_type', 'multi_purchase', 'send_photo', 'localized_name', 'measure', 'value', 'value_hint',
                'delivery_phone', 'icon', 'product_photo', 'is_coupon_limited', 'is_adult', 'status', 'instruction',
                'show_full_bold', 'name', 'localized_value', 'localized_value_hint', 'overrides', 'localized_description',
                'localized_short_description', 'show_new', 'lazy_integration'
              ]
          }
        };
      }

      if (!fields.certificate_id) {
        throw new HttpError(400, 'Certificate id required');
      }

      const certificateTable = yield Table.fetch('certificates', this.application.id);
      let certificate = yield certificateTable.find({id: fields.certificate_id}, options)
        .catch((e) => ({data: null}));
      certificate = certificate.data;

      if (!certificate || !certificate.product) {
        return this.body = {};
      }

      certificate.server_time = Date.now();

      const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
      let cards = yield cardsTable.findAll({
        product_id: certificate.product.id.toString(),
        status: StatusesDictionary.ACTIVE,
      });
      cards = cards.data;

      if (!cards.length) {
        return this.body = {};
      }

      let contragentIds = [];
      let cardStoreIds = [];
      cards.map((card) => {
        contragentIds.push(card.contragent_id.toString());
        cardStoreIds = cardStoreIds.concat(card.stores);
      });

      const contragentsTable = yield Table.fetch('contragents', this.application.id);
      let contragents = yield contragentsTable.findAll({user_id: {$in: contragentIds}});

      // Определение телефона доставки и имени контрагента и по результатам заполняем метаданные сертификата
      if (!contragents.data.length) {
        return this.body = {};
      }

      contragents = contragents.data.map((contragent) => {
        let result = {
          id: contragent.id,
          name: contragent.name,
          localized_name: contragent.localized_name,
          phone: contragent.phone,
          user_id: contragent.user_id,
          fact_city_dict: contragent.fact_city_dict,
          use_api_address: contragent.use_api_address
        };
        if (contragent.logo) {
          result.logo = contragent.logo;
        }
        if (contragent.fact_city) {
          result.fact_city = contragent.fact_city;
        }
        if (contragent.delivery_provider) {
          result.delivery_provider = contragent.delivery_provider;
        }
        if (contragent.use_api_address) {
          result.use_api_address = contragent.use_api_address;
        }
        if (contragent.localized_name) {
          if (fields.locale && contragent.localized_name[fields.locale]) {
            result.name = contragent.localized_name[fields.locale];
          } else if (contragent.localized_name[Config.defaultLocale]) {
            result.name = contragent.localized_name[Config.defaultLocale];
          }
          delete contragent.localized_name;
        }
        if (fields.out === 'short' && contragent.fact_city_dict) {
          result.fact_city_dict = contragent.fact_city_dict.name;
        }
        return result;
      });
      certificate.product.contragent = contragents;

      if (fields.out !== 'short') {
        Object.assign(certificate, {contragents: contragents});

        const storesTable = yield Table.fetch('stores', this.application.id);
        let stores = yield storesTable.findAll({
          id: {$in: cardStoreIds},
          status: StatusesDictionary.ACTIVE,
        });
        stores = stores.data;

        const storesGeo = stores.map((store) => {
          return {
            geo: store.geo && store.geo.reverse() || [0.0, 0.0],
            name: store.name,
            street: store.street,
            building: store.building,
            id: store.id,
          };
        });
        Object.assign(certificate, {stores_geo: storesGeo});

        let rawStoresCities = {};
        stores.map((store) => {
          if (store.city_dict && store.city_dict.name) {
            let clearName = store.city_dict.name.replace(/(^\s*г\.\s*|^\s*гор\.\s*)(.*)/g, '$2').trim();
            rawStoresCities[clearName] = 1;
          }
        });
        let storesCities = Object.keys(rawStoresCities);
        Object.assign(certificate, {stores_cities: storesCities});

        // Добавлены сущности категорий в продукт
        const categoriesTable = yield Table.fetch('product_categories', this.application.id);
        let productsCategories = yield categoriesTable.findAll({id: {$in: certificate.product.categories}});
        certificate.product.categories = productsCategories.data;

      }


      // Определение типа сертификата
      certificate = utils.detectCertificateStatus(certificate);

      if (certificate.product.localized_name) {
        if (fields.locale && certificate.product.localized_name[fields.locale]) {
          certificate.product.name = certificate.product.localized_name[fields.locale];
        } else if(certificate.product.localized_name[Config.defaultLocale]) {
          certificate.product.name = certificate.product.localized_name[Config.defaultLocale];
        }
        delete certificate.product.localized_name;
      }

      if (certificate.product.instruction) {
        let instructionId = certificate.product.instruction;
        const instructionsTable = yield Table.fetch('product_instructions', this.application.id);

        let instruction = yield instructionsTable.find({id: instructionId, status: StatusesDictionary.ACTIVE})
          .catch((e) => ({data: null}));
        instruction = instruction.data;

        if (instruction) {
          if (fields.out !== 'short') {
            certificate.product.instruction = instruction.description || '';
          }
          let currentItems = instruction.items;
          if (instruction.localized_items) {
            if (fields.locale && instruction.localized_items[fields.locale]) {
              currentItems = instruction.localized_items[fields.locale];
            } else if(instruction.localized_items[Config.defaultLocale]) {
              currentItems = instruction.localized_items[Config.defaultLocale];
            }
          }

          if (currentItems && currentItems.length > 0) {
            certificate.product.instruction_items = currentItems.filter((item) =>
              (!item.purpose) || fields.purpose === item.purpose
            );
            certificate.product.instruction_items.forEach((item) => {
              if(item.text) {
                item.text = item.text.replace(/\$\{cert\.code\}/g, certificate.code).replace(/\$\{cert\.pin\}/g, certificate.pin).replace(/\$\{cert\.custom_code\}/g, certificate.custom_code).replace(/\$\{prod\.name\}/g, certificate.product.name);
              }
              if(item.actions && item.actions.length > 0) {
                item.actions.forEach((action) => {
                  if(action.params && action.params.main) {
                    action.params.main = action.params.main.replace(/\$\{cert\.code\}/g, certificate.code).replace(/\$\{cert\.pin\}/g, certificate.pin).replace(/\$\{cert\.custom_code\}/g, certificate.custom_code).replace(/\$\{prod\.name\}/g, certificate.product.name);
                  }
                });
              }
            });
          }
        }
      }

      if (certificate.buyer_id) {
        let buyerId = certificate.buyer_id;
        const usersTable = yield Table.fetch('users', this.application.id);

        let buyer = yield usersTable.find({user_id: buyerId})
          .catch((e) => ({data: null}));
        buyer = buyer.data;

        if (buyer) {
          certificate.buyer = buyer;
        }
      }

      const certificateGivingTable = yield Table.fetch('certificate_giving_history', this.application.id);
      const sentGpon = yield certificateGivingTable.findAll({certificate: fields.certificate_id}, {sort: {createdAt: -1}})
        .catch((e) => ({data: null}));

      if (sentGpon.data && sentGpon.data.length > 0) {
        const usersTable = yield Table.fetch('users', this.application.id);
        let giver = yield usersTable.find({user_id: sentGpon.data[0].giver_id})
          .catch((e) => ({data: null}));

        giver = giver.data;
        if (giver) {
          certificate.giver = giver;
        }
      }

      if (!certificate.giver) {
        certificate.giver = certificate.buyer;
      }

      if (certificate.cashing_type == 2) {
        let callDeliveryTargets = contragents.map((contragent) => {
          return {
            name: contragent.name,
            phone: contragent.phone,
          };
        });

        certificate.call_delivery_targets = callDeliveryTargets;
      }

      if (certificate.product.localized_value) {
        if (fields.locale && certificate.product.localized_value[fields.locale]) {
          certificate.product.value = certificate.product.localized_value[fields.locale];
        } else if(certificate.product.localized_value[Config.defaultLocale]) {
          certificate.product.value = certificate.product.localized_value[Config.defaultLocale];
        }
        delete certificate.product.localized_value;
      }

      if (certificate.product.localized_value_hint) {
        if (fields.locale && certificate.product.localized_value_hint[fields.locale]) {
          certificate.product.value_hint = certificate.product.localized_value_hint[fields.locale];
        } else if(certificate.product.localized_value_hint[Config.defaultLocale]) {
          certificate.product.value_hint = certificate.product.localized_value_hint[Config.defaultLocale];
        }
        delete certificate.product.localized_value_hint;
      }

      if (certificate.product.localized_description) {
        if (fields.locale && certificate.product.localized_description[fields.locale]) {
          certificate.product.description = certificate.product.localized_description[fields.locale];
        } else if(certificate.product.localized_description[Config.defaultLocale]) {
          certificate.product.description = certificate.product.localized_description[Config.defaultLocale];
        }
        delete certificate.product.localized_description;
      }

      if (certificate.product.localized_short_description) {
        if (fields.locale && certificate.product.localized_short_description[fields.locale]) {
          certificate.product.short_description = certificate.product.localized_short_description[fields.locale];
        } else if(certificate.product.localized_short_description[Config.defaultLocale]) {
          certificate.product.short_description = certificate.product.localized_short_description[Config.defaultLocale];
        }
        delete certificate.product.localized_short_description;
      }

      if(Array.isArray(certificate.product.short_description) && certificate.product.short_description.length === 0) {
        certificate.product.short_description = "";
      }

      if (certificate.delivery_agent && certificate.delivery_agent.localized_name) {
        if (fields.locale && certificate.delivery_agent.localized_name[fields.locale]) {
          certificate.delivery_agent.name = certificate.delivery_agent.localized_name[fields.locale];
        } else if(certificate.delivery_agent.localized_name[Config.defaultLocale]) {
          certificate.delivery_agent.name = certificate.delivery_agent.localized_name[Config.defaultLocale];
        }
        delete certificate.delivery_agent.localized_name;
      }
      if (certificate.product.lazy_integration) {
        let pin = certificate.pin;
        if(!certificate.code || certificate.code.match(/^(\d{3}[A-Z]-){3}\d{4}$/)) {
          certificate.need_integrate = true;
        } else if("*****" === pin || "*****;" === pin || "******" === pin || "******;" === pin) {
          certificate.need_integrate = true;
        }
      }

      if (fields.out === 'short') {
        if(certificate.giver) {
          delete certificate.giver.push_tokens;
        }
        if(certificate.buyer) {
          delete certificate.buyer.push_tokens;
        }
        delete certificate.product.instruction;
        if (certificate.delivery_agent) {
          certificate.delivery_agent = {
            logo: certificate.delivery_agent.logo,
            name: certificate.delivery_agent.name,
            phone: certificate.delivery_agent.phone
          };
        }
      }

      this.body = {data: certificate};
    } catch (err) {
      console.error(err);
      throw new HttpError(400, 'Problem with certificate generation');
    }
  });

module.exports = router;
