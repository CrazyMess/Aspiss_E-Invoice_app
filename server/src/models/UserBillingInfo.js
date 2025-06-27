const pool = require('../db.js');

class UserBillingInfo {
    /**
     * Creates new billing information for a user.
     * @param {Object} billingData - Billing details (userId, billingEntityName, billingTaxId, address, city, postalCode, country)
     * @returns {Object} The created billing info object.
     */
    static async create({ userId, billingEntityName, billingTaxId, address, city, postalCode, country }) {
        const query = `
            INSERT INTO user_billing_info (user_id, billing_entity_name, billing_tax_id, address, city, postal_code, country)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING billing_info_id, user_id, billing_entity_name, billing_tax_id, address, city, postal_code, country;
        `;
        const values = [userId, billingEntityName, billingTaxId, address, city, postalCode, country];

        try {
            const result = await pool.query(query, values);
            return result.rows[0]; // Return the created billing info object
        } catch (error) {
            console.error('Error creating user billing info:', error);
            throw error;
        }
    }

     /**
     * Finds billing information for a specific user.
     * @param {string} userId - The ID of the user.
     * @returns {Object|null} The billing info object or null if not found.
     */
     static async findByUserId(userId) {
        const query = `
            SELECT billing_info_id, user_id, billing_entity_name, billing_tax_id, address, city, postal_code, country
            FROM user_billing_info
            WHERE user_id = $1;
        `;
        const values = [userId];

        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error finding user billing info by user ID:', error);
            throw error;
        }
    }

    
    /**
     * Updates existing billing information for a user.
     * @param {string} userId - The ID of the user whose billing info to update.
     * @param {Object} updates - Fields to update.
     * @returns {Object|null} The updated billing info object or null if not found/owned by user.
     */
    static async update(userId, updates) {
        let updateQueryParts = [];
        let updateValues = [];
        let paramIndex = 1;

        const allowedFields = ['billingEntityName', 'billingTaxId', 'address', 'city', 'postalCode', 'country'];
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                // Convert camelCase to snake_case for column names
                updateQueryParts.push(`${field.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${paramIndex++}`);
                updateValues.push(updates[field]);
            }
        }

        if (updateQueryParts.length === 0) {
            return null; // No updates provided
        }

        const query = `
            UPDATE user_billing_info
            SET ${updateQueryParts.join(', ')}
            WHERE user_id = $${paramIndex}
            RETURNING billing_info_id, user_id, billing_entity_name, billing_tax_id, address, city, postal_code, country;
        `;
        updateValues.push(userId);

        try {
            const result = await pool.query(query, updateValues);
            return result.rows[0];
        } catch (error) {
            console.error('Error updating user billing info:', error);
            throw error;
        }
    }

    /**
     * Deletes billing information for a user.
     * @param {string} userId - The ID of the user whose billing info to delete.
     * @returns {boolean} True if deleted, false otherwise.
     */
    static async delete(userId) {
        const query = `
            DELETE FROM user_billing_info
            WHERE user_id = $1
            RETURNING billing_info_id;
        `;
        const values = [userId];

        try {
            const result = await pool.query(query, values);
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error deleting user billing info:', error);
            throw error;
        }
    }
}

module.exports = UserBillingInfo;