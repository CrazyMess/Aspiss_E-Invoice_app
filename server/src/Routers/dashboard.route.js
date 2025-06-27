const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();


// Protect all dashboard routes
router.use(authMiddleware);

// GET consolidated dashboard summary
router.get('/summary', dashboardController.getDashboardSummary);

// PUT update  invoice generated count (e.g., after successful invoice generation)
router.put('/subscription/invoices', dashboardController.updateSubscriptionInvoices);

// PUT update full subscription details (e.g., after plan change/renewal)
router.put('/subscription',dashboardController.updateUserSubscription);

module.exports = router;