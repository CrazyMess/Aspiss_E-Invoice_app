const express = require("express");
const authController = require("../Controllers/auth.controller.js"); // Import the auth controller
const authMiddleware = require("../middleware/authMiddleware.js"); // Import the authentication middleware

const router = express.Router();

// Public routes
router.post("/signup", authController.signup); // Route for user signup
router.post("/login", authController.login); // Route for user login 

// Protected routes (apply authMiddleware)
router.put('/update-profile', authMiddleware, authController.updateUserProfile); // NEW
router.post('/change-password', authMiddleware, authController.changeUserPassword); // NEW

module.exports = router;