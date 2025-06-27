const User = require('../models/User.js');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "123456789";


// @route   POST /api/auth/signup
// @desc    Register user
// @access  Public
exports.signup = async (req, res) => {
    const { fullName, email, password, phoneNumber } = req.body;

    // Basic validation
    if (!fullName || !email || !password || !phoneNumber) {
        return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
    }

    try {
        // check if user already exists
        let user = await User.findByEmail(email);
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Set default plan to "Free" upon registration
        user = await User.create({ email, password, fullName, phoneNumber, subscriptionPlan: 'Free' });

        // Generate JWT token (payload only needs userId for identification)
        const payload = {
            userId: user.user_id,
            fullName: user.full_name, // Store full name in token for easy access in frontend
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({
                    message: 'User registered successfully',
                    token,
                    user: {
                        userId: user.user_id,
                        fullName: user.full_name,
                        email: user.email,
                        phoneNumber: user.phone_number,
                        subscriptionPlan: user.subscription_plan,
                    },
                });
            }
        );
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.login = async (req, res) => {
   const { email, password } = req.body;

   if (!email || !password) {
        return res.status(400).json({ message: "L'e-mail et le mot de passe sont requis." });
   }

   try {
    const user = await User.findByEmail(email);
    if (!user) {
        return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const payload = {
        userId: user.user_id,
        fullName: user.full_name, // Store full name in token for easy access in frontend
    };

    jwt.sign(
        payload,
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '1h' },
        async (err, token) => {
            if (err) throw err;

            // Check for user billing info to update hasBillingInfo flag
            const UserBillingInfo = require('../models/UserBillingInfo'); // Import here to avoid circular dependency
            let hasBillingInfo = false;
            try {
                const billingInfo = await UserBillingInfo.findByUserId(user.user_id);
                hasBillingInfo = !!billingInfo; // True if billing info exists
            } catch (billingErr) {
                console.error("Error checking billing info during login:", billingErr.message);
                // Continue login process even if billing info check fails
            }

            res.json({
                message: 'Logged in successfully',
                token,
                user: {
                    userId: user.user_id,
                    fullName: user.full_name,
                    email: user.email,
                    phoneNumber: user.phone_number,
                    subscriptionPlan: user.subscription_plan,
                    subscriptionStatus: user.subscription_status,
                    subscriptionExpirationDate: user.subscription_expiration_date,
                    invoicesGenerated: user.invoices_generated,
                    invoicesLimit: user.max_number_of_invoices,
                    hasBillingInfo: hasBillingInfo, // Add hasBillingInfo to user object
                },
            });
        }
    );
   } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
   }
};

// @route   PUT /api/auth/update-profile
// @desc    Update authenticated user's profile information
// @access  Private
exports.updateUserProfile = async (req, res) => {
    const userId = req.userId; // From auth middleware
    const { fullName, email, phone } = req.body;

    try {
        // Basic validation (optional, more robust validation can be added)
        if (!fullName && !email && !phone) {
            return res.status(400).json({ message: 'No fields provided for update.' });
        }

        // Prevent changing email to an already existing one (if changed)
        if (email && email !== req.user.email) { // req.user.email assumes you set req.user in auth middleware
                                                 // if you don't set req.user, you'd need to fetch user first
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.user_id !== userId) {
                return res.status(409).json({ message: 'Email already in use by another account.' });
            }
        }

        const updatedUser = await User.updateProfile(userId, { fullName, email, phoneNumber: phone });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Re-generate token if email or full name changed to reflect new data
        // For simplicity, we won't regenerate token for now. Frontend can update its local user state.

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                userId: updatedUser.user_id,
                fullName: updatedUser.full_name,
                email: updatedUser.email,
                phoneNumber: updatedUser.phone_number,
            }
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error updating profile', error: error.message });
    }
};

// @route   POST /api/auth/change-password
// @desc    Change authenticated user's password
// @access  Private
exports.changeUserPassword = async (req, res) => {
    const userId = req.userId; // From auth middleware
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mot de passe actuel incorrect.' });
        }

        // Basic new password validation
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({ message: 'Le nouveau mot de passe doit être différent de l\'ancien.' });
        }

        await User.changePassword(userId, newPassword);

        res.status(200).json({ message: 'Mot de passe modifié avec succès.' });
    } catch (error) {
        console.error('Error changing user password:', error);
        res.status(500).json({ message: 'Server error changing password', error: error.message });
    }
};

// @route   GET /api/auth/check
// @desc    Check if token is valid and user is authenticated
// @access  Private (used for protected routes)
exports.checkAuth = async (req, res) => {
    try {
        // The verifyToken middleware would have already attached req.userId
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        res.status(200).json({ isAuthenticated: true, user: {
            userId: user.user_id,
            fullName: user.full_name,
            email: user.email,
            phoneNumber: user.phone_number,
            maxNumberOfFiles: user.max_number_of_files,
            maxNumberOfInvoices: user.max_number_of_invoices,
            subscriptionStatus: user.subscription_status,
            subscriptionPlan: user.subscription_plan,
            subscriptionExpirationDate: user.subscription_expiration_date,
            invoicesGenerated: user.invoices_generated,
        }});
    } catch (error) {
        console.error('Auth check error:', error.message);
        res.status(500).json({ message: 'Erreur interne du serveur', error: error.message });
    }
};
