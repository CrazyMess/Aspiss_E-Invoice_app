const User = require('../models/User'); // Correct path to User model
const Company = require('../models/Company'); // Correct path to Company model
const Activity = require('../models/Activity'); // Correct path to Activity model
const UserBillingInfo = require('../models/UserBillingInfo');

// @route   GET /api/dashboard/summary
// @desc    Get consolidated dashboard data for the authenticated user
// @access  Private (requires token)
exports.getDashboardSummary = async (req, res) => {
    try {
        const userId = req.userId; // User ID from auth middleware

        // Fetch user details including subscription and limits
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Fetch companies associated with the user
        const companies = await Company.findByUserId(userId);
        

        // Fetch recent activities for the user
        const recentActivity = await Activity.findRecentByUserId(userId, 5); // Limit to 5 recent activities

        // Fetch billing information associated with the user
        const userBillingInfo = await UserBillingInfo.findByUserId(userId);

        // Format subscription data for frontend consumption, matching V0 structure
        const subscription = {
            status: user.subscription_status,
            plan: user.subscription_plan,
            expirationDate: user.subscription_expiration_date, // This will be a Date object
            invoicesGenerated: user.invoices_generated,
            invoicesLimit: user.max_number_of_invoices // Use the user's max limit
        };

        // Format companies for frontend if needed (e.g., camelCase keys)
        const formattedCompanies = companies.map(comp => ({
            id: comp.company_id,
            name: comp.name,
            taxId: comp.tax_id,
            status: comp.status, // Assuming you add status to your PG company table later
            city: comp.city,
            country: comp.country, // Added from schema
            email: comp.email,     // Added from schema
            phone: comp.phone      // Added from schema
        }));

        // Format recent activity for frontend if needed
        const formattedRecentActivity = recentActivity.map(act => ({
            id: act.activity_id,
            action: act.action,
            company: act.company,
            count: act.count,
            status: act.status,
            date: act.created_at // Use created_at for date, will be a Date object
        }));


        res.status(200).json({
            user: {
                fullName: user.full_name,
                email: user.email,
            },
            subscription: subscription,
            companies: formattedCompanies,
            recentActivity: formattedRecentActivity,
            hasBillingInfo: !!userBillingInfo // Flag for frontend
        });

    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ message: 'Erreur interne du serveur', error: error.message });
    }
};

// @route   PUT /api/dashboard/subscription/invoices
// @desc    Update the number of invoices generated for the current month/period for the authenticated user
// @access  Private (requires token) - For internal use, e.g., after successful invoice generation
exports.updateSubscriptionInvoices = async (req, res) => {
    try {
        const userId = req.userId;
        const { count = 1 } = req.body; // Default to increment by 1

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        const currentGenerated = user.invoices_generated;
        const limit = user.max_number_of_invoices;

        if (currentGenerated + count > limit) {
            return res.status(400).json({ message: 'Limite de facture dépassée pour le forfait actuel.' });
        }

        const updatedUser = await User.updateSubscription(userId, { invoicesGenerated: currentGenerated + count });

        res.status(200).json({
            message: 'Le nombre de factures générées a été mis à jour avec succès',
            invoicesGenerated: updatedUser.invoices_generated
        });
    } catch (error) {
        console.error('Error updating invoice count:', error);
        res.status(500).json({ message: 'Erreur interne du serveur', error: error.message });
    }
};

// @route   PUT /api/dashboard/subscription
// @desc    Update user's subscription details (e.g., plan, expiration, reset count)
// @access  Private (requires token, usually admin or payment gateway callback)
exports.updateUserSubscription = async (req, res) => {
    try {
        const userId = req.userId;
        const { status, plan, expirationDate, maxNumberOfInvoices, maxNumberOfFiles } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Prepare updates for the User.updateSubscription method
        const updates = {};
        if (status) updates.subscriptionStatus = status;
        if (plan) updates.subscriptionPlan = plan;
        if (expirationDate) updates.subscriptionExpirationDate = new Date(expirationDate);
        if (maxNumberOfInvoices !== undefined) updates.maxNumberOfInvoices = maxNumberOfInvoices;
        if (maxNumberOfFiles !== undefined) updates.maxNumberOfFiles = maxNumberOfFiles;

        // Logic for resetting invoicesGenerated on plan change/renewal
        if (status === 'active' && user.subscription_status !== 'active') {
            updates.invoicesGenerated = 0; // Reset count on activation
        }

        const updatedUser = await User.updateSubscription(userId, updates);

        if (!updatedUser) {
            return res.status(500).json({ message: "Échec de la mise à jour de l'abonnement utilisateur." });
        }

        res.status(200).json({
            message: 'Abonnement mis à jour avec succès',
            user: {
                userId: updatedUser.user_id,
                fullName: updatedUser.full_name,
                email: updatedUser.email,
                maxNumberOfFiles: updatedUser.max_number_of_files,
                maxNumberOfInvoices: updatedUser.max_number_of_invoices,
                subscriptionStatus: updatedUser.subscription_status,
                subscriptionPlan: updatedUser.subscription_plan,
                subscriptionExpirationDate: updatedUser.subscription_expiration_date,
                invoicesGenerated: updatedUser.invoices_generated,
            }
        });
    } catch (error) {
        console.error('Error updating user subscription:', error);
        res.status(500).json({ message: 'Erreur interne du serveur', error: error.message });
    }
};
