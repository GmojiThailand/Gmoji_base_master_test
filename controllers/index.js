'use strict';

const Router = require('../models/Router');
const router = new Router();

router.use('/api/v1', require('./CashCertificateWrap').routes());
router.use('/api/v1', require('./CertificateGenerator').routes());
router.use('/api/v1', require('./CheckCategoryTop').routes());
router.use('/api/v1', require('./CheckMailAndPhone').routes());
router.use('/api/v1', require('./CheckUniqueParams').routes());
router.use('/api/v1', require('./ConfirmCoupons').routes());
router.use('/api/v1', require('./ContragentFinStream').routes());
router.use('/api/v1', require('./ContragentRulesProductEdit').routes());
router.use('/api/v1', require('./ContragentsByProduct').routes());
router.use('/api/v1', require('./CreateCategory').routes());
router.use('/api/v1', require('./CreateNewCa').routes());
router.use('/api/v1', require('./CreateProduct').routes());
router.use('/api/v1', require('./CreateStore').routes());
router.use('/api/v1', require('./CsvParseStart').routes());
router.use('/api/v1', require('./CsvParseFinish').routes());
router.use('/api/v1', require('./DeliveryService').routes());

router.use('/api/v1', require('./EWalletRegistration').routes());
router.use('/api/v1', require('./EditCa').routes());
router.use('/api/v1', require('./EditCategory').routes());
router.use('/api/v1', require('./EditProduct').routes());
router.use('/api/v1', require('./EditProfileMobile').routes());
router.use('/api/v1', require('./EditStore').routes());

router.use('/api/v1', require('./FindGponForCash').routes());

router.use('/api/v1', require('./GetCategories').routes());
router.use('/api/v1', require('./GetContragent').routes());
router.use('/api/v1', require('./GetContragentInfo').routes());
router.use('/api/v1', require('./GetContragentProductRules').routes());
router.use('/api/v1', require('./GetContragentStores').routes());
router.use('/api/v1', require('./GetContragents').routes());
router.use('/api/v1', require('./GetGpon').routes());
router.use('/api/v1', require('./GetGponsByProduct').routes());
router.use('/api/v1', require('./GetGponsList').routes());
router.use('/api/v1', require('./GetLogsList').routes());
router.use('/api/v1', require('./GetMyCertificates').routes());
router.use('/api/v1', require('./GetProductByIdWithLimits').routes());
router.use('/api/v1', require('./GetSendCertificates').routes());
router.use('/api/v1', require('./GetStorageInfo').routes());
router.use('/api/v1', require('./GetUserInfo').routes());
router.use('/api/v1', require('./GetUsersList').routes());
router.use('/api/v1', require('./GiftStat').routes());

router.use('/api/v1', require('./IsUniqueCategoryName').routes());

router.use('/api/v1', require('./Administration').routes());
router.use('/api/v1', require('./LogoutMobile').routes());

router.use('/api/v1', require('./PasswordGen').routes());
router.use('/api/v1', require('./ProductListWithCertificateCount').routes());
router.use('/api/v1', require('./ProductsByCategory').routes());

router.use('/api/v1', require('./SetMyCertificates').routes());
router.use('/api/v1', require('./SetSendCertificates').routes());
router.use('/api/v1', require('./SoftDeleteCa').routes());
router.use('/api/v1', require('./SoftDeleteCategory').routes());
router.use('/api/v1', require('./SoftDeleteProduct').routes());
router.use('/api/v1', require('./SoftDeleteUser').routes());
router.use('/api/v1', require('./SoftDeleteStore').routes());
router.use('/api/v1', require('./UpdateCertificateStatus').routes());


// -------NEW API ----------------

router.use('/api/v1', require('./Authenticator').routes());
router.use('/api/v1', require('./ChangeSequence').routes());
router.use('/api/v1', require('./GetAdminLogs').routes());
router.use('/api/v1', require('./AdminController').routes());

router.use('/api/v1', require('./ContragentCardStores').routes());
router.use('/api/v1', require('./CreateProductContragentCard').routes());
router.use('/api/v1', require('./GetProductContragentCards').routes());
router.use('/api/v1', require('./EditProductContragentCard').routes());
router.use('/api/v1', require('./SoftDeleteProductContragentCard').routes());

router.use('/api/v1', require('./OneSAccountingExport').routes());

router.use('/api/v1', require('./GetContractorProducts').routes());
router.use('/api/v1', require('./GetContractorStores').routes());
router.use('/api/v1', require('./GetProductPhoto').routes());

router.use('/api/v1/db', require('./DB').routes());

router.use('/api/v1', require('./URLPairs').routes());

router.use('/api/v1', require('./GetCashingStores').routes());

router.use('/api/v1', require('./CheckCertificateStatus').routes());

router.use('/api/v1', require('./GetStore').routes());
router.use('/api/v1', require('./GetProduct').routes());

router.use('/api/v1', require('./EmailVerification').routes());
router.use('/api/v1', require('./RoleController').routes());

router.use('/api/v1', require('./PushNotificationController').routes());
router.use('/api/v1', require('./DeliveryServiceWeb').routes());
router.use('/api/v1', require('./InstructionController').routes());
router.use('/api/v1', require('./ProductStoreCardsController').routes());
router.use('/api/v1', require('./LocaleController').routes());
router.use('/api/v1', require('./SubwayStationController').routes());
router.use('/api/v1', require('./ProductTagController').routes());

module.exports = router;
