const express = require('express');
const router = express.Router();
const generateController = require('../Controllers/generate.controller');
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get('/template', generateController.generateExcelTemplate);
router.post('/xml', generateController.generateXmlInvoice); // This will handle the acutal XML generation
router.post('/validate-excel', generateController.validateExcelData); // Route for validation only


module.exports = router;