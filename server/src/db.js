const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test the database connection
pool.on('connect', () => {
    console.log('request through');
});

pool.on('error', (err) => {
    console.error('Database connection error:', err.stack);
});

module.exports = pool;