require("dotenv").config();
const sql = require("mssql");

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

let pool

async function getPool() {
  if (pool?.connected) {
    return pool;
  }

  try {
    pool = await new sql.ConnectionPool(config).connect();
    return pool;
  } catch (err) {
    pool = null;
    throw err;
  }
}

async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

module.exports = {
  getPool,
  closePool,
  sql,
};
