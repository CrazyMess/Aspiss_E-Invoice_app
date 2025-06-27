const express = require('express');
const router = express.Router();
const lookupController = require('../Controllers/lookup.controller.js');

// IMPORTANT: By default, lookup routes are public. If you need them private,
// uncomment the line below and ensure client-side sends token with these requests.
// const authMiddleware = require('../middleware/auth.middleware');
// router.use(authMiddleware);

router.get('/partner-identifier-types', lookupController.getPartnerIdentifierTypes);
router.get('/document-types', lookupController.getDocumentTypes);
router.get('/language-codes', lookupController.getLanguageCodes);
router.get('/date-functions', lookupController.getDateFunctions);
router.get('/free-text-subjects', lookupController.getFreeTextSubjects);
router.get('/location-functions', lookupController.getLocationFunctions);
router.get('/partner-functions', lookupController.getPartnerFunctions);
router.get('/party-name-formats', lookupController.getPartyNameFormats);
router.get('/reference-qualifiers', lookupController.getReferenceQualifiers);
router.get('/contact-functions', lookupController.getContactFunctions);
router.get('/communication-means', lookupController.getCommunicationMeans);
router.get('/payment-terms-types', lookupController.getPaymentTermsTypes);
router.get('/payment-condition', lookupController.getPaymentConditions);
router.get('/payment-means', lookupController.getPaymentMeans);
router.get('/financial-institution-types', lookupController.getFinancialInstitutionTypes);
router.get('/allowance-type', lookupController.getAllowanceTypes);
router.get('/tax-type', lookupController.getTaxTypes);
router.get('/amount-type', lookupController.getAmountTypes);

module.exports = router;
