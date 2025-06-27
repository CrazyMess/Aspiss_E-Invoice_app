const Company = require('../models/Company'); // Correct path
const Activity = require('../models/Activity'); // For logging activity

// @route   POST /api/companies
// @desc    Add a new company for the authenticated user
// @access  Private (requires token)
exports.addCompany = async (req, res) => {
    try {
        const userId = req.userId;

        const { name, taxId, taxIdTypeCode, address, city, postalCode, country, email, phone } = req.body;

        // Basic validation for required fields from the UX/schema
        if (!name || !taxId || !city || !country) {
            return res.status(400).json({ message: "Le nom de l'entreprise, le numéro d'identification fiscale, la ville et le pays sont obligatoires." });
        }

        const newCompany = await Company.create({
            userId, 
            name, taxId, taxIdTypeCode, address, city, postalCode, country, email, phone
        });

        // Log activity
        await Activity.create({
            userId: userId,
            action: 'Entreprise ajoutée',
            company: name,
            details: { companyId: newCompany.company_id } // Use newCompany.company_id (PostgreSQL PK)
        });

        res.status(201).json({ message: 'Entreprise ajoutée avec succès', company: newCompany });
    } catch (error) {
        console.error('Error adding company in controller:', error);
        // Include more error details for debugging
        res.status(500).json({
            message: 'Server error during company creation',
            error: error.message,
            detail: error.detail,
            code: error.code,
            constraint: error.constraint // If it's a unique constraint violation etc.
        });
    }
};

// @route   GET /api/companies
// @desc    Get all companies for the authenticated user
// @access  Private (requires token)
exports.getCompanies = async (req, res) => {
    try {
        const userId = req.userId;
        const companies = await Company.findByUserId(userId);
        res.status(200).json(companies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ message: 'Erreur de serveur', error: error.message });
    }
};

// @route   GET /api/companies/:id
// @desc    Get a single company by ID for the authenticated user
// @access  Private (requires token)
exports.getCompanyById = async (req, res) => {
    try {
        const userId = req.userId;
        const companyId = req.params.id;
        const company = await Company.findByIdAndUserId(companyId, userId);
        if (!company) {
            return res.status(404).json({ message: 'Entreprise non trouvée ou non autorisée' });
        }
        res.status(200).json(company);
    } catch (error) {
        console.error('Error fetching company by ID:', error);
        res.status(500).json({ message: 'Erreur de serveur', error: error.message });
    }
};

// @route   PUT /api/companies/:id
// @desc    Update a company by ID for the authenticated user
// @access  Private (requires token)
exports.updateCompany = async (req, res) => {
    try {
        const userId = req.userId;
        const companyId = req.params.id;
        const updates = req.body; // Contains fields to update

        const updatedCompany = await Company.update(companyId, userId, updates);

        if (!updatedCompany) {
            return res.status(404).json({ message: 'Entreprise non trouvée ou non autorisée à mettre à jour' });
        }

        // Log activity
        await Activity.create({
            userId: userId,
            action: 'Société mise à jour',
            company: updatedCompany.name,
            details: { companyId: updatedCompany.company_id }
        });

        res.status(200).json({ message: 'Société mise à jour avec succès', company: updatedCompany });
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ message: 'Erreur de serveur', error: error.message });
    }
};

// @route   DELETE /api/companies/:id
// @desc    Delete a company by ID for the authenticated user
// @access  Private (requires token)
exports.deleteCompany = async (req, res) => {
    try {
        const userId = req.userId;
        const companyId = req.params.id;

        const deleted = await Company.delete(companyId, userId);

        if (!deleted) {
            return res.status(404).json({ message: 'Entreprise non trouvée ou non autorisée à supprimer' });
        }

        // Log activity (note: company name might not be available after deletion)
        await Activity.create({
            userId: userId,
            action: 'Entreprise supprimée',
            details: { companyId: companyId } // Log the ID if name isn't available
        });

        res.status(200).json({ message: 'Entreprise supprimée avec succès' });
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ message: 'Erreur de serveur', error: error.message });
    }
};
