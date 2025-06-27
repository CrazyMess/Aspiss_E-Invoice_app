const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const companyController = require('../Controllers/company.controller');
const router = express.Router();

// Protect all company routes
router.use(authMiddleware);

// POST add a new company
router.post('/', companyController.addCompany);

// GET all companies for the user
router.get('/', companyController.getCompanies);

// GET a single company by ID
router.get('/:id', companyController.getCompanyById);

// PUT update a company by ID
router.put('/:id', companyController.updateCompany);

// DELETE a company by ID
router.delete('/:id', companyController.deleteCompany);

module.exports = router;