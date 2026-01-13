'use strict';

const Router = require('../../models/Router');
const router = new Router();

router.use('/users', require('./Users').routes());
router.use('/products', require('./Products').routes());
router.use('/limits', require('./Limits').routes());
router.use('/stores', require('./Stores').routes());
router.use('/payture_orders', require('./PaytureOrders').routes());
router.use('/statuses', require('./Statuses').routes());
router.use('/product_categories', require('./ProductCategories').routes());
router.use('/images', require('./Images').routes());
router.use('/contragents', require('./Contragents').routes());
router.use('/product_photos', require('./ProductPhotos').routes());
router.use('/locale', require('./Locale').routes());

module.exports = router;
