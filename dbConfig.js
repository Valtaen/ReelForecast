require("dotenv").config();

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: 3000,
  idleTimeoutMillis: 300000,
  connectionTimeoutMillis: 300000,
});

module.exports = { pool };