const Activity = require('../models/Activity'); // Correct path

// @route   GET /api/activity
// @desc    Get all activities for the authenticated user
// @access  Private (requires token)
exports.getActivities = async (req, res) => {
    try {
        const userId = req.userId;
        const activities = await Activity.findAllByUserId(userId);
        res.status(200).json(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ message: 'Erreur de serveur', error: error.message });
    }
};

// @route   POST /api/activity/log
// @desc    Log a new activity for the authenticated user (for internal use by the app)
// @access  Private (requires token)
exports.logActivity = async (req, res) => {
    try {
        const userId = req.userId;
        const { action, company, count, status, details } = req.body;

        if (!action) {
            return res.status(400).json({ message: "Une action d'activité est requise." });
        }

        const newActivity = await Activity.create({
            userId, action, company, count, status, details
        });

        res.status(201).json({ message: 'Activité enregistrée avec succès', activity: newActivity });
    } catch (error) {
        console.error('Error logging activity:', error);
        res.status(500).json({ message: 'Erreur de serveur', error: error.message });
    }
};
