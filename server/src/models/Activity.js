const pool = require('../db.js');

class Activity {
    /**
     * Logs a new user activity.
     * @param {Object} activityData - Activity details (userId, action, company, count, status, details)
     * @returns {Object} The created activity log entry.
     */
    static async create({ userId, action, company, count, status, details }) {
        const query = `
            INSERT INTO activity (user_id, action, company, count, status, details)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING activity_id, user_id, action, company, count, status, details, created_at;
        `;
        // 'details' column is TEXT in SQL, so stringify JSON objects before inserting
        const values = [userId, action, company, count || 1, status || 'success', details || null];

        try {
            const result = await pool.query(query, values);
            // Parse details back to object if it was stored as JSON string
            const createdActivity = result.rows[0];
            return createdActivity;
        } catch (error) {
            console.error('Error creating activity:', error);
            throw error;
        }
    }

    /**
     * Finds recent activities for a user.
     * @param {string} userId - The ID of the user.
     * @param {number} limit - The maximum number of activities to return.
     * @returns {Array} List of activity objects.
     */
    static async findRecentByUserId(userId, limit = 5) {
        const query = `
            SELECT activity_id, action, company, count, status, details, created_at
            FROM activity
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2;
        `;
        const values = [userId, limit];

        try {
            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error finding recent activities by user ID:', error);
            throw error;
        }
    }

    /**
     * Finds all activities for a user.
     * @param {string} userId - The ID of the user.
     * @returns {Array} List of all activity objects.
     */
    static async findAllByUserId(userId) {
        const query = `
            SELECT activity_id, action, company, count, status, details, created_at
            FROM activity
            WHERE user_id = $1
            ORDER BY created_at DESC;
        `;
        const values = [userId];

        try {
            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error finding all activities by user ID:', error);
            throw error;
        }
    }
}

module.exports = Activity;
