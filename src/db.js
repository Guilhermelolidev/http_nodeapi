const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ApiSemExpress',
  user: 'postgres',
  password: '123',
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

module.exports = { 
    async query(sql, params) {
      const start = Date.now();
      const res = await pool.query(sql, params);
      const duration = Date.now() - start;
      console.log('executed query', { sql, duration, rowCount: res.rowCount })
      return res;
    }
 }

