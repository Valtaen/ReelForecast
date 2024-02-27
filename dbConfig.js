require("dotenv").config();

const { Pool } = require('pg');

// const isProduction = process.env.NODE_ENV === "production";

// const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

// const pool = new Pool({
//   connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
//   ssl: isProduction
// });

const pool = new Pool({
  user: 'matt',
  host: 'localhost',
  database: 'reelforecast',
  password: 'Ereth242',
  port: 3000,
  idleTimeoutMillis: 300000,
  connectionTimeoutMillis: 300000,
});

module.exports = { pool };