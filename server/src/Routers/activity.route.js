const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all activity routes
router.use(authMiddleware);

// GET all activities for the user
router.get('/', activityController.getActivities);

// POST log a new activity (internal use)
router.post('/log', activityController.logActivity);

module.exports = router;
