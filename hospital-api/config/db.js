const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Root@123',
  database: 'hospital_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Test connection
pool.getConnection()
    .then(conn => {
        console.log('✅ MySQL Connected via config/db.js');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Database Connection Failed:', err.message);
    });

module.exports = pool;