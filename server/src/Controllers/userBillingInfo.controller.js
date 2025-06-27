const UserBillingInfo = require('../models/UserBillingInfo');

// @route   POST /api/user/billing-info
// @desc    Create user billing information
// @access  Private
exports.createBillingInfo = async (req, res) => {
    try {
        const userId = req.userId;
        const { billingEntityName, billingTaxId, address, city, postalCode, country } = req.body;

        if (!billingEntityName || !country) {
            return res.status(400).json({ message: "Le nom et le pays de l'entité de facturation sont obligatoires."});
        }

        // Check if billing info already exists for this user (only one per user)
        const existingBillingInfo = await UserBillingInfo.findByUserId(userId);
        if (existingBillingInfo) {
            return res.status(409).json({ message: 'Les informations de facturation existent déjà pour cet utilisateur.' });
        }

        const newBillingInfo = await UserBillingInfo.create({
            userId, billingEntityName, billingTaxId, address, city, postalCode, country
        });

        res.status(201).json({ message: 'Informations de facturation créées avec succès', billingInfo: newBillingInfo });
    } catch (error) {
        console.error('Error creating billing info:', error);
        res.status(500).json({ message: 'Erreur de serveur', error: error.message });
    }
};

// @route   GET /api/user/billing-info
// @desc    Get user billing information
// @access  Private
exports.getBillingInfo = async (req, res) => {
    try {
        const userId = req.userId;
        const billingInfo = await UserBillingInfo.findByUserId(userId);

        if (!billingInfo) {
            return res.status(404).json({ message: 'Informations de facturation introuvables pour cet utilisateur.' });
        }

        res.status(200).json({ billingInfo });
    } catch (error) {
        console.error('Error fetching billing info:', error);
        res.status(500).json({ message: 'Erreur de serveur', error: error.message });
    }
};

// @route   PUT /api/user/billing-info
// @desc    Update user billing information
// @access  Private
exports.updateBillingInfo = async (req, res) => {
    try {
        const userId = req.userId;
        const updates = req.body;

        const updatedBillingInfo = await UserBillingInfo.update(userId, updates);

        if (!updatedBillingInfo) {
            return res.status(404).json({ message: 'Informations de facturation introuvables ou aucune mise à jour fournie.' });
        }

        res.status(200).json({ message: 'Informations de facturation mises à jour avec succès', billingInfo: updatedBillingInfo });
    } catch (error) {
        console.error('Error updating billing info:', error);
        res.status(500).json({ message: 'Erreur de serveur', error: error.message });
    }
};

// @route   DELETE /api/user/billing-info
// @desc    Delete user billing information
// @access  Private
exports.deleteBillingInfo = async (req, res) => {
    try {
        const userId = req.userId;
        const deleted = await UserBillingInfo.delete(userId);

        if (!deleted) {
            return res.status(404).json({ message: 'Informations de facturation introuvables pour cet utilisateur.' });
        }

        res.status(200).json({ message: 'Les informations de facturation ont été supprimées avec succès' });
    } catch (error) {
        console.error('Error deleting billing info:', error);
        res.status(500).json({ message: 'Erreur de serveur', error: error.message });
    }
};
