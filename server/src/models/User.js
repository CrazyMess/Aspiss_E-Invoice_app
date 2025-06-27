const pool = require("../db.js");
const bcrypt = require("bcrypt");

class User {
  /**
   * Creates a new user in the database.
   * Includes default subscription and invoice limits.
   * @param {Object} userData - User data (fullName, email, password, phoneNumber)
   * @returns {Object} The created user object (excluding password hash)
   */
  static async create({ fullName, email, password, phoneNumber }) {
    // Hash the password before storing it
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // SQL query to insert user data, including default subscription and limits
    const query = `
            INSERT INTO users (full_name, email, password_hash, phone_number,
                                max_number_of_files, max_number_of_invoices,
                                subscription_status, subscription_plan, subscription_expiration_date, invoices_generated)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING user_id, full_name, email, phone_number, max_number_of_files, max_number_of_invoices,
                      subscription_status, subscription_plan, subscription_expiration_date, invoices_generated, created_at;
        `;
    // Default values for new fields:
    const maxNumberOfFiles = 10;
    const maxNumberOfInvoices = 100;
    const subscriptionStatus = "active";
    const subscriptionPlan = "Free";
    const subscriptionExpirationDate = new Date(
      new Date().setFullYear(new Date().getFullYear() + 1)
    ); // 1 year from now
    const invoicesGenerated = 0;

    const values = [
      fullName,
      email,
      passwordHash,
      phoneNumber,
      maxNumberOfFiles,
      maxNumberOfInvoices,
      subscriptionStatus,
      subscriptionPlan,
      subscriptionExpirationDate,
      invoicesGenerated,
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0]; // Return the created user object without the password
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Finds a user by email.
   * @param {string} email - The email address of the user.
   * @returns {Object|null} The user object or null if not found.
   */
  static async findByEmail(email) {
    const query = "SELECT * FROM users WHERE email = $1";
    const values = [email];

    try {
      const result = await pool.query(query, values);
      return result.rows[0]; // Return the user object if found
    } catch (error) {
      console.error("Error finding user by email:", error);
      throw error;
    }
  }

  /**
   * Finds a user by user_id.
   * @param {string} userId - The UUID of the user.
   * @returns {Object|null} The user object or null if not found.
   */
  static async findById(userId) {
    const query = `
            SELECT user_id, full_name, email, phone_number, password_hash,
                   max_number_of_files, max_number_of_invoices,
                   subscription_status, subscription_plan, subscription_expiration_date, invoices_generated,
                   created_at, updated_at
            FROM users WHERE user_id = $1
        `;
    const values = [userId];
    try {
      const result = await pool.query(query, values);
      return result.rows[0]; // Return the user object if found
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw error;
    }
  }

  /**
   * Updates a user's subscription details and limits.
   * @param {string} userId - The ID of the user to update.
   * @param {Object} updates - Object containing fields to update (e.g., status, plan, expirationDate, invoicesGenerated, maxNumberOfInvoices, maxNumberOfFiles)
   * @returns {Object} The updated user object.
   */
  static async updateSubscription(userId, updates) {
    let updateQueryParts = [];
    let updateValues = [];
    let paramIndex = 1;

    if (updates.subscriptionStatus !== undefined) {
      updateQueryParts.push(`subscription_status = $${paramIndex++}`);
      updateValues.push(updates.subscriptionStatus);
    }
    if (updates.subscriptionPlan !== undefined) {
      updateQueryParts.push(`subscription_plan = $${paramIndex++}`);
      updateValues.push(updates.subscriptionPlan);
    }
    if (updates.subscriptionExpirationDate !== undefined) {
      updateQueryParts.push(`subscription_expiration_date = $${paramIndex++}`);
      updateValues.push(updates.subscriptionExpirationDate);
    }
    if (updates.invoicesGenerated !== undefined) {
      updateQueryParts.push(`invoices_generated = $${paramIndex++}`);
      updateValues.push(updates.invoicesGenerated);
    }
    if (updates.maxNumberOfFiles !== undefined) {
      updateQueryParts.push(`max_number_of_files = $${paramIndex++}`);
      updateValues.push(updates.maxNumberOfFiles);
    }
    if (updates.maxNumberOfInvoices !== undefined) {
      updateQueryParts.push(`max_number_of_invoices = $${paramIndex++}`);
      updateValues.push(updates.maxNumberOfInvoices);
    }

    if (updateQueryParts.length === 0) {
      return null; // No updates provided
    }

    const query = `
            UPDATE users
            SET ${updateQueryParts.join(", ")}, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $${paramIndex}
            RETURNING user_id, full_name, email, phone_number,
                      max_number_of_files, max_number_of_invoices,
                      subscription_status, subscription_plan, subscription_expiration_date, invoices_generated,
                      created_at, updated_at;
        `;
    updateValues.push(userId);

    try {
      const result = await pool.query(query, updateValues);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating user subscription:", error);
      throw error;
    }
  }

  /**
   * Compares a plain password with a hashed password.
   * @param {string} password - The plain text password.
   * @param {string} userPasswordHash - The hashed password from the database.
   * @returns {boolean} True if passwords match, false otherwise.
   */
  static async comparePassword(password, userPasswordHash) {
    return await bcrypt.compare(password, userPasswordHash);
  }

  /**
   * Updates user profile information.
   * @param {string} userId - The UUID of the user.
   * @param {Object} updates - Object containing fields to update (fullName, email, phoneNumber).
   * @returns {Object|null} The updated user object or null if not found.
   */
  static async updateProfile(userId, { fullName, email, phoneNumber }) {
    const updateFields = [];
    const values = [userId];
    let paramIndex = 2; // Start index for dynamic parameters

    if (fullName !== undefined) {
      updateFields.push(`full_name = $${paramIndex++}`);
      values.push(fullName);
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (phoneNumber !== undefined) {
      updateFields.push(`phone_number = $${paramIndex++}`);
      values.push(phoneNumber);
    }

    if (updateFields.length === 0) {
      return await this.findById(userId); // No updates, just return current user data
    }

    const query = `
            UPDATE users
            SET ${updateFields.join(", ")}, updated_at = NOW()
            WHERE user_id = $1
            RETURNING user_id, full_name, email, phone_number, created_at, updated_at;
        `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  /**
   * Updates user's password.
   * @param {string} userId - The UUID of the user.
   * @param {string} newPassword - The new password (will be hashed).
   * @returns {Object|null} The updated user object (without password hash) or null if not found.
   */
  static async changePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const query = `
            UPDATE users
            SET password_hash = $2, updated_at = NOW()
            WHERE user_id = $1
            RETURNING user_id, full_name, email, phone_number, created_at, updated_at;
        `;
    const values = [userId, passwordHash];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error changing user password:", error);
      throw error;
    }
  }
}

module.exports = User;
