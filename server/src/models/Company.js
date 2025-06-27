const pool = require('../db'); 

class Company {
    /**
     * Creates a new company for a user.
     * @param {Object} companyData - Company details (userId, name, taxId, taxIdTypeCode, address, city, postalCode, country, email, phone)
     * @returns {Object} The created company object.
     */
    static async create( {userId, name, taxId, taxIdTypeCode, address, city, postalCode, country, email, phone}) {
        const query = `
            INSERT INTO company (user_id, name, tax_id, tax_id_type_code, address, city, postal_code, country, email, phone)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING company_id, user_id, name, tax_id, tax_id_type_code, address, city, postal_code, country, email, phone, created_at;
        `;
        const values = [userId, name, taxId, taxIdTypeCode, address, city, postalCode, country, email, phone];

        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating company:', error);
            throw error;
        }
    }

    /**
     * Finds all companies associated with a specific user.
     * @param {string} userId - The ID of the user.
     * @returns {Array} List of company objects.
     */
    static async findByUserId(userId) {
        const query = `
            SELECT company_id, name, tax_id, tax_id_type_code, address, city, postal_code, country, email, phone, created_at, updated_at
            FROM company
            WHERE user_id = $1;
        `;
        const values = [userId];

        try {
            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error finding companies by user ID:', error);
            throw error;
        }
    }

    /**
     * Finds a single company by its ID and user ID.
     * Ensures user ownership.
     * @param {string} companyId - The ID of the company.
     * @param {string} userId - The ID of the user.
     * @returns {Object|null} The company object or null if not found/owned by user.
     */
    static async findByIdAndUserId(companyId, userId) {
        const query = `
            SELECT company_id, name, tax_id, tax_id_type_code, address, city, postal_code, country, email, phone, created_at, updated_at
            FROM company
            WHERE company_id = $1 AND user_id = $2;
        `;
        const values = [companyId, userId];

        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error finding company by ID and user ID:', error);
            throw error;
        }
    }

    /**
     * Updates an existing company.
     * @param {string} companyId - The ID of the company to update.
     * @param {string} userId - The ID of the user owning the company.
     * @param {Object} updates - Fields to update.
     * @returns {Object|null} The updated company object or null if not found/owned by user.
     */
    static async update(companyId, userId, updates) {
        let updateQueryParts = [];
        let updateValues = [];
        let paramIndex = 1;

        // Dynamically build the update query based on provided fields
        const allowedFields = ['name', 'taxId', 'taxIdTypeCode', 'address', 'city', 'postalCode', 'country', 'email', 'phone'];
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                updateQueryParts.push(`${field.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${paramIndex++}`);
                updateValues.push(updates[field]);
            }
        }

        if (updateQueryParts.length === 0) {
            return null; // No updates provided
        }

        const query = `
            UPDATE company
            SET ${updateQueryParts.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE company_id = $${paramIndex++} AND user_id = $${paramIndex++}
            RETURNING company_id, user_id, name, tax_id, tax_id_type_code, address, city, postal_code, country, email, phone, updated_at;
        `;
        updateValues.push(companyId, userId);

        try {
            const result = await pool.query(query, updateValues);
            return result.rows[0];
        } catch (error) {
            console.error('Error updating company:', error);
            throw error;
        }
    }

     /**
     * Deletes a company.
     * @param {string} companyId - The ID of the company to delete.
     * @param {string} userId - The ID of the user owning the company.
     * @returns {boolean} True if deleted, false otherwise.
     */
     static async delete(companyId, userId) {
        const query = `
            DELETE FROM company
            WHERE company_id = $1 AND user_id = $2
            RETURNING company_id;
        `;
        const values = [companyId, userId];

        try {
            const result = await pool.query(query, values);
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error deleting company:', error);
            throw error;
        }
    }
}

module.exports = Company;