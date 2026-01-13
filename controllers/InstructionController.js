'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const HttpError = require('../models/Error');
const StatusesDictionary = require('../models/dictionaries/Status');

const router = new Router();

router.post('/create_instruction',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {name, description, items, localized_items, hide_numeration} = this.request.fields;
    if (!name || !items) throw new HttpError(400, 'Bad request');
    const productInstructionsTable = yield Table.fetch('product_instructions', this.application.id);
    let instruction = yield productInstructionsTable.find({name}).catch((e) => ({data: null}));
    let pInstruction;
    if (!instruction.data) {
      pInstruction = yield productInstructionsTable.create({name, description, items, localized_items, hide_numeration, status: StatusesDictionary.ACTIVE});
    } else {
      throw new HttpError(400, 'Name already exists');
    }
    this.body = pInstruction;
  });

router.post('/edit_instruction',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const data = this.request.fields;
    if (!data.id) throw new HttpError(400, 'Bad request');
    const productInstructionsTable = yield Table.fetch('product_instructions', this.application.id);
    if (data.name) {
      let instruction = yield productInstructionsTable.find({name: data.name}).catch((e) => ({data: null}));
      if (instruction.data) { throw new HttpError(400, 'Name already exists'); }
    }
    let updInstruction;
    try {
      updInstruction = yield productInstructionsTable.findOneAndUpdate({id: data.id, status: StatusesDictionary.ACTIVE}, data, {new: true});
    } catch (e) {
      throw new HttpError(404, 'Instruction not found');
    }

    this.body = updInstruction.data;
  });

router.post('/get_instruction',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {id} = this.request.fields;
    if (!id) throw new HttpError(400, 'Bad request');
    const productInstructionsTable = yield Table.fetch('product_instructions', this.application.id);
    let instruction = yield productInstructionsTable.find({id, status: StatusesDictionary.ACTIVE}).catch((e) => ({data: null}));
    if (!instruction.data) { throw new HttpError(404, 'Instruction not found'); }

    const productsTable = yield Table.fetch('products', this.application.id);
    const products = yield productsTable.findAll({instruction: id, status: StatusesDictionary.ACTIVE}, {select: ['name', 'localized_name', 'price']});
    instruction.data.products = products.data;
    this.body = instruction.data;
  });

router.all('/get_all_instruction',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {out} = this.request.fields;
    const productInstructionsTable = yield Table.fetch('product_instructions', this.application.id);
    let instructions = (yield productInstructionsTable.findAll({status: StatusesDictionary.ACTIVE})).data;

    if (out !== 'short') {
      let instrIds = instructions.map((i) => i.id);
      const productsTable = yield Table.fetch('products', this.application.id);
      const products = yield productsTable.findAll({instruction: {$in: instrIds}, status: StatusesDictionary.ACTIVE}, {select: ['name', 'localized_name', 'price', 'instruction']});

      instructions = instructions.map((instr) => {
        let p = products.data.filter((prod) => {
          if (instr.id.toString() === prod.instruction.toString()) {
            return true;
          } else {
            return false;
          }
        });
        instr.products = p;
        return instr;
      });
    }

    this.body = instructions;
  });

router.post('/delete_instruction',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {id} = this.request.fields;
    const productsTable = yield Table.fetch('products', this.application.id);
    let products = (yield productsTable.findAll({instruction: id, status: StatusesDictionary.ACTIVE}).catch((e) => { return {data: []}; })).data;
    if (products.length) {
      throw new HttpError(400, 'Instruction has active product');
    }
    products = (yield productsTable.findAll({instruction: id, status: {$ne: StatusesDictionary.ACTIVE}}).catch((e) => { return {data: []}; })).data;
    if (products.length) {
      const productsIds = products.map((v) => v.id);
      const certificatesTable = yield Table.fetch('certificates', this.application.id);
      const certificates = (yield certificatesTable.findAll(
        {
          product: {$in: productsIds},
          status: StatusesDictionary.ACTIVE
        }).catch((e) => { return {data: []}; })).data;

      if (certificates.length) {
        throw new HttpError(400, 'Instruction has product with active certificates');
      }
    }
    try {
      const productInstructionsTable = yield Table.fetch('product_instructions', this.application.id);
      yield productInstructionsTable.findOneAndUpdate({id}, {status: StatusesDictionary.DELETED});
    } catch (e) {
      throw new HttpError(400, 'Cant delete instruction');
    }
    this.body = {data: 'ok'};
  });


module.exports = router;
