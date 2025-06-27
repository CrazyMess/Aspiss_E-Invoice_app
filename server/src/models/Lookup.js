const pool = require('../db.js');

class Lookup {
    /**
     * Fetches all entries from the _partner_identifier_type lookup table.
     * @returns {Array} A list of partner identifier types with code and description.
     */
    static async getPartnerIdentifierTypes() {
        const query = `
            SELECT code, description
            FROM _partner_identifier_type
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching partner identifier types:', error);
            throw error;
        }
    }

    /**
     * Fetches all entries from the _document_type lookup table.
     * @returns {Array} A list of document types with code and description.
     */
    static async getDocumentTypes() {
        const query = `
            SELECT code, description
            FROM _document_type
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching document types:', error);
            throw error;
        }
    }

    /**
     * Fetches all entries from the _language_code lookup table.
     * @returns {Array} A list of language codes with code and name.
     */
    static async getLanguageCodes() {
        const query = `
            SELECT code, name
            FROM _language_code
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching language codes:', error);
            throw error;
        }
    }

    /**
     * Fetches all entries from the _date_function lookup table.
     * @returns {Array} A list of date functions with code and description.
     */
    static async getDateFunctions() {
        const query = `
            SELECT code, description
            FROM _date_function
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching date functions:', error);
            throw error;
        }
    }

    /**
     * Fetches all entries from the _free_text_subject lookup table.
     * @returns {Array} A list of free text subjects with code and description.
     */
    static async getFreeTextSubjects() {
        const query = `
            SELECT code, description
            FROM _free_text_subject
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching free text subjects:', error);
            throw error;
        }
    }

    /**
     * Fetches all entries from the _location_function lookup table.
     * @returns {Array} A list of location functions with code and description.
     */
    static async getLocationFunctions() {
        const query = `
            SELECT code, description
            FROM _location_function
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching location functions:', error);
            throw error;
        }
    }

    /**
     * Fetches all entries from the _partner_function lookup table.
     * @returns {Array} A list of partner functions with code and description.
     */
    static async getPartnerFunctions() {
        const query = `
            SELECT code, description
            FROM _partner_function
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching partner functions:', error);
            throw error;
        }
    }

    /**
     * Fetches all entries from the _party_name_format lookup table.
     * @returns {Array} A list of party name formats with code and description.
     */
    static async getPartyNameFormats() {
        const query = `
            SELECT code, description
            FROM _party_name_format
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching party name formats:', error);
            throw error;
        }
    }

    /**
     * Fetches all entries from the _reference_qualifier lookup table.
     * @returns {Array} A list of reference qualifiers with code and description.
     */
    static async getReferenceQualifiers() {
        const query = `
            SELECT code, description
            FROM _reference_qualifier
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching reference qualifiers:', error);
            throw error;
        }
    }

    /**
     * Fetches all entries from the _contact_function lookup table.
     * @returns {Array} A list of contact functions with code and description.
     */
    static async getContactFunctions() {
        const query = `
            SELECT code, description
            FROM _contact_function
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching contact functions:', error);
            throw error;
        }
    }

    /**
     * Fetches all entries from the _communication_means lookup table.
     * @returns {Array} A list of communication means with code and description.
     */
    static async getCommunicationMeans() {
        const query = `
            SELECT code, description
            FROM _communication_means
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching communication means:', error);
            throw error;
        }
    }

    /**
     * Fetches all entries from the _payment_terms_type lookup table.
     * @returns {Array} A list of payment terms types with code and description.
     */
    static async getPaymentTermsTypes() {
        const query = `
            SELECT code, description
            FROM _payment_terms_type
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching payment terms types:', error);
            throw error;
        }
    }

    /**
     * Fetches all entries from the _payment_condition lookup table.
     * @returns {Array} A list of payment conditions with code and description.
     */
    static async getPaymentConditions() {
        const query = `
            SELECT code, description
            FROM _payment_condition
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching payment conditions:', error);
            throw error;
        }
    }

    /**
     * Fetches all entries from the _payment_means lookup table.
     * @returns {Array} A list of payment means with code and description.
     */
    static async getPaymentMeans() {
        const query = `
            SELECT code, description
            FROM _payment_means
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching payment means:', error);
            throw error;
        }
    }

    /**
     * Fetches all entries from the _financial_institution_type lookup table.
     * @returns {Array} A list of financial institution types with code and description.
     */
    static async getFinancialInstitutionTypes() {
        const query = `
            SELECT code, description
            FROM _financial_institution_type
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching financial institution types:', error);
            throw error;
        }
    }

    /**
     * Fetches all entries from the _allowance_type lookup table.
     * @returns {Array} A list of allowance types with code and description.
     */
    static async getAllowanceTypes() {
        const query = `
            SELECT code, description
            FROM _allowance_type
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching allowance types:', error);
            throw error;
        }
    }

    /**
     * Fetches all entries from the _tax_type lookup table.
     * @returns {Array} A list of tax types with code and description.
     */
    static async getTaxTypes() {
        const query = `
            SELECT code, description
            FROM _tax_type
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching tax types:', error);
            throw error;
        }
    }

    /**
     * Fetches all entries from the _amount_type lookup table.
     * @returns {Array} A list of amount types with code and description.
     */
    static async getAmountTypes() {
        const query = `
            SELECT code, description
            FROM _amount_type
            ORDER BY code;
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching amount types:', error);
            throw error;
        }
    }
}

module.exports = Lookup;
