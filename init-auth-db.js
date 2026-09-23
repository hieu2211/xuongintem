const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'sakuko_tem',
});

async function init() {
  console.log('Khởi tạo bảng Users và User Access Logs...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        open_id VARCHAR(128) UNIQUE NOT NULL,
        union_id VARCHAR(128),
        name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        email VARCHAR(255),
        mobile VARCHAR(64),
        first_login_at TIMESTAMP DEFAULT NOW(),
        last_login_at TIMESTAMP DEFAULT NOW(),
        login_count INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_access_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        open_id VARCHAR(128),
        user_name VARCHAR(255),
        ip_address VARCHAR(128),
        user_agent TEXT,
        action VARCHAR(64) NOT NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON user_access_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON user_access_logs(created_at DESC);
  `);
  console.log('✅ Khởi tạo cơ sở dữ liệu thành công!');
  process.exit(0);
}

init().catch(err => {
  console.error('❌ Lỗi khởi tạo cơ sở dữ liệu:', err);
  process.exit(1);
});
