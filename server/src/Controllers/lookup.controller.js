const Lookup = require('../models/Lookup');

// @route   GET /api/lookups/partner-identifier-types
// @desc    Get all partner identifier types
// @access  Public (or Private if needed, current setup is public)
exports.getPartnerIdentifierTypes = async (req, res) => {
    try {
        const types = await Lookup.getPartnerIdentifierTypes();
        res.status(200).json(types);
    } catch (error) {
        console.error('Error in getPartnerIdentifierTypes controller:', error);
        res.status(500).json({ message: 'Server error fetching partner identifier types', error: error.message });
    }
};

// @route   GET /api/lookups/document-types
// @desc    Get all document types
// @access  Public
exports.getDocumentTypes = async (req, res) => {
    try {
        const types = await Lookup.getDocumentTypes();
        res.status(200).json(types);
    } catch (error) {
        console.error('Error in getDocumentTypes controller:', error);
        res.status(500).json({ message: 'Server error fetching document types', error: error.message });
    }
};

// @route   GET /api/lookups/language-codes
// @desc    Get all language codes
// @access  Public
exports.getLanguageCodes = async (req, res) => {
    try {
        const codes = await Lookup.getLanguageCodes();
        res.status(200).json(codes);
    } catch (error) {
        console.error('Error in getLanguageCodes controller:', error);
        res.status(500).json({ message: 'Server error fetching language codes', error: error.message });
    }
};

// @route   GET /api/lookups/date-functions
// @desc    Get all date functions
// @access  Public
exports.getDateFunctions = async (req, res) => {
    try {
        const functions = await Lookup.getDateFunctions();
        res.status(200).json(functions);
    } catch (error) {
        console.error('Error in getDateFunctions controller:', error);
        res.status(500).json({ message: 'Server error fetching date functions', error: error.message });
    }
};

// @route   GET /api/lookups/free-text-subjects
// @desc    Get all free text subjects
// @access  Public
exports.getFreeTextSubjects = async (req, res) => {
    try {
        const subjects = await Lookup.getFreeTextSubjects();
        res.status(200).json(subjects);
    } catch (error) {
        console.error('Error in getFreeTextSubjects controller:', error);
        res.status(500).json({ message: 'Server error fetching free text subjects', error: error.message });
    }
};

// @route   GET /api/lookups/location-functions
// @desc    Get all location functions
// @access  Public
exports.getLocationFunctions = async (req, res) => {
    try {
        const functions = await Lookup.getLocationFunctions();
        res.status(200).json(functions);
    } catch (error) {
        console.error('Error in getLocationFunctions controller:', error);
        res.status(500).json({ message: 'Server error fetching location functions', error: error.message });
    }
};

// @route   GET /api/lookups/partner-functions
// @desc    Get all partner functions
// @access  Public
exports.getPartnerFunctions = async (req, res) => {
    try {
        const functions = await Lookup.getPartnerFunctions();
        res.status(200).json(functions);
    } catch (error) {
        console.error('Error in getPartnerFunctions controller:', error);
        res.status(500).json({ message: 'Server error fetching partner functions', error: error.message });
    }
};

// @route   GET /api/lookups/party-name-formats
// @desc    Get all party name formats
// @access  Public
exports.getPartyNameFormats = async (req, res) => {
    try {
        const formats = await Lookup.getPartyNameFormats();
        res.status(200).json(formats);
    } catch (error) {
        console.error('Error in getPartyNameFormats controller:', error);
        res.status(500).json({ message: 'Server error fetching party name formats', error: error.message });
    }
};

// @route   GET /api/lookups/reference-qualifiers
// @desc    Get all reference qualifiers
// @access  Public
exports.getReferenceQualifiers = async (req, res) => {
    try {
        const qualifiers = await Lookup.getReferenceQualifiers();
        res.status(200).json(qualifiers);
    } catch (error) {
        console.error('Error in getReferenceQualifiers controller:', error);
        res.status(500).json({ message: 'Server error fetching reference qualifiers', error: error.message });
    }
};

// @route   GET /api/lookups/contact-functions
// @desc    Get all contact functions
// @access  Public
exports.getContactFunctions = async (req, res) => {
    try {
        const functions = await Lookup.getContactFunctions();
        res.status(200).json(functions);
    } catch (error) {
        console.error('Error in getContactFunctions controller:', error);
        res.status(500).json({ message: 'Server error fetching contact functions', error: error.message });
    }
};

// @route   GET /api/lookups/communication-means
// @desc    Get all communication means
// @access  Public
exports.getCommunicationMeans = async (req, res) => {
    try {
        const means = await Lookup.getCommunicationMeans();
        res.status(200).json(means);
    } catch (error) {
        console.error('Error in getCommunicationMeans controller:', error);
        res.status(500).json({ message: 'Server error fetching communication means', error: error.message });
    }
};

// @route   GET /api/lookups/payment-terms-types
// @desc    Get all payment terms types
// @access  Public
exports.getPaymentTermsTypes = async (req, res) => {
    try {
        const types = await Lookup.getPaymentTermsTypes();
        res.status(200).json(types);
    } catch (error) {
        console.error('Error in getPaymentTermsTypes controller:', error);
        res.status(500).json({ message: 'Server error fetching payment terms types', error: error.message });
    }
};

// @route   GET /api/lookups/payment-condition
// @desc    Get all payment conditions
// @access  Public
exports.getPaymentConditions = async (req, res) => {
    try {
        const conditions = await Lookup.getPaymentConditions();
        res.status(200).json(conditions);
    } catch (error) {
        console.error('Error in getPaymentConditions controller:', error);
        res.status(500).json({ message: 'Server error fetching payment conditions', error: error.message });
    }
};

// @route   GET /api/lookups/payment-means
// @desc    Get all payment means
// @access  Public
exports.getPaymentMeans = async (req, res) => {
    try {
        const means = await Lookup.getPaymentMeans();
        res.status(200).json(means);
    } catch (error) {
        console.error('Error in getPaymentMeans controller:', error);
        res.status(500).json({ message: 'Server error fetching payment means', error: error.message });
    }
};

// @route   GET /api/lookups/financial-institution-types
// @desc    Get all financial institution types
// @access  Public
exports.getFinancialInstitutionTypes = async (req, res) => {
    try {
        const types = await Lookup.getFinancialInstitutionTypes();
        res.status(200).json(types);
    } catch (error) {
        console.error('Error in getFinancialInstitutionTypes controller:', error);
        res.status(500).json({ message: 'Server error fetching financial institution types', error: error.message });
    }
};

// @route   GET /api/lookups/allowance-type
// @desc    Get all allowance types
// @access  Public
exports.getAllowanceTypes = async (req, res) => {
    try {
        const types = await Lookup.getAllowanceTypes();
        res.status(200).json(types);
    } catch (error) {
        console.error('Error in getAllowanceTypes controller:', error);
        res.status(500).json({ message: 'Server error fetching allowance types', error: error.message });
    }
};

// @route   GET /api/lookups/tax-type
// @desc    Get all tax types
// @access  Public
exports.getTaxTypes = async (req, res) => {
    try {
        const types = await Lookup.getTaxTypes();
        res.status(200).json(types);
    } catch (error) {
        console.error('Error in getTaxTypes controller:', error);
        res.status(500).json({ message: 'Server error fetching tax types', error: error.message });
    }
};

// @route   GET /api/lookups/amount-type
// @desc    Get all amount types
// @access  Public
exports.getAmountTypes = async (req, res) => {
    try {
        const types = await Lookup.getAmountTypes();
        res.status(200).json(types);
    } catch (error) {
        console.error('Error in getAmountTypes controller:', error);
        res.status(500).json({ message: 'Server error fetching amount types', error: error.message });
    }
};
