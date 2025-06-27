const express = require('express');
const router = express.Router();
const userBillingInfoController = require('../Controllers/userBillingInfo.controller');
const authMiddleware = require('../middleware/authMiddleware');



// All routes here require authentication
router.use(authMiddleware);

router.post('/', userBillingInfoController.createBillingInfo);
router.get('/', userBillingInfoController.getBillingInfo);
router.put('/', userBillingInfoController.updateBillingInfo);
router.delete('/', userBillingInfoController.deleteBillingInfo);

module.exports = router;