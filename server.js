require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bwipjs = require('bwip-js');

const app = express();
const port = process.env.PORT || 4200;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'sakuko_tem',
});

// Khởi tạo bảng Users và User Access Logs nếu chưa có
async function initAuthTables() {
  try {
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
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(32) DEFAULT 'user';

      -- Đảm bảo Hoàng Văn Hiếu luôn luôn là Quản trị viên (Admin)
      UPDATE users 
      SET role = 'admin' 
      WHERE open_id = 'ou_07ff157813f7a579760d5e076f2e0860' 
         OR LOWER(email) = 'hieuhv2@sakukovietnam.com.vn' 
         OR name ILIKE '%Hoàng Văn Hiếu%';
    `);
  } catch (err) {
    console.error('Lỗi khởi tạo bảng auth:', err);
  }
}
initAuthTables();

// Cơ chế phiên làm việc (Session Token signed HMAC)
const SESSION_SECRET = process.env.SESSION_SECRET || 'sakuko_lark_session_key_2026';

function createSessionToken(user) {
  const payload = JSON.stringify({
    id: user.id,
    open_id: user.open_id,
    name: user.name,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 ngày
  });
  const b64 = Buffer.from(payload).toString('base64url');
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(b64).digest('base64url');
  return `${b64}.${hmac}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [b64, hmac] = token.split('.');
  const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET).update(b64).digest('base64url');
  if (hmac !== expectedHmac) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}


// Thư mục lưu trữ vĩnh viễn barcode trên ổ cứng máy chủ
const barcodeCacheDir = path.join(__dirname, 'cache_barcodes');
if (!fs.existsSync(barcodeCacheDir)) {
    try {
        fs.mkdirSync(barcodeCacheDir, { recursive: true });
    } catch (e) {
        console.error('Không thể tạo thư mục cache_barcodes:', e);
    }
}

// Bộ nhớ đệm RAM siêu nhanh cho các mã vừa dùng
const barcodeCache = new Map();

// API tạo Barcode đa tầng (RAM Cache -> Disk Cache -> bwip-js Local Render)
app.get('/api/barcode', async (req, res) => {
  const text = req.query.text;
  const scale = parseInt(req.query.scale) || 3;
  const height = parseInt(req.query.height) || 16;
  const textsize = parseInt(req.query.textsize) || 10;
  
  if (!text) {
      return res.status(400).send('Missing text parameter');
  }

  const cacheKey = `${text}_${scale}_${height}_${textsize}`;
  const safeFileName = `${String(text).replace(/[^a-zA-Z0-9_-]/g, '_')}_s${scale}_h${height}_t${textsize}.png`;
  const filePath = path.join(barcodeCacheDir, safeFileName);

  res.set('Content-Type', 'image/png');
  res.set('Cache-Control', 'public, max-age=31536000, immutable');

  // TẦNG 1: Kiểm tra RAM cache (tốc độ 0ms)
  if (barcodeCache.has(cacheKey)) {
      return res.send(barcodeCache.get(cacheKey));
  }

  // TẦNG 2: Kiểm tra Disk cache trên ổ cứng (tốc độ ~0.2ms - không bao giờ mất kể cả khi khởi động lại server)
  try {
      if (fs.existsSync(filePath)) {
          const diskBuffer = await fs.promises.readFile(filePath);
          if (barcodeCache.size < 10000) barcodeCache.set(cacheKey, diskBuffer);
          return res.send(diskBuffer);
      }
  } catch (readErr) {
      console.warn('Lỗi đọc disk cache barcode:', readErr);
  }

  // TẦNG 3: Sinh mã cục bộ trực tiếp bằng bwip-js (offline 100%, không phụ thuộc mạng ngoài, mất ~5ms)
  try {
      const buffer = await bwipjs.toBuffer({
          bcid: 'code128',
          text: text,
          scale: scale,
          height: height,
          includetext: true,
          textxalign: 'center',
          textsize: textsize
      });

      // Lưu song song vào RAM cache
      if (barcodeCache.size >= 10000) {
          const firstKey = barcodeCache.keys().next().value;
          barcodeCache.delete(firstKey);
      }
      barcodeCache.set(cacheKey, buffer);

      // Lưu bất đồng bộ xuống ổ cứng để lần sau không bao giờ phải tạo lại
      fs.promises.writeFile(filePath, buffer).catch(writeErr => {
          console.error('Lỗi ghi disk cache barcode:', writeErr);
      });

      return res.send(buffer);
  } catch (err) {
      console.error('Lỗi khi tạo barcode cục bộ:', err);
      res.status(500).send('Error generating barcode');
  }
});

// API tìm kiếm sản phẩm (hỗ trợ search theo tên hoặc mã vạch)
app.get('/api/products', async (req, res) => {
  const q = req.query.q || '';
  try {
    let result;
    if (q) {
      result = await pool.query(
        `SELECT item_no, item_name as name, retail_price as price, barcode, 
                uom as unit, category_name, is_synced_app_web 
         FROM items 
         WHERE item_name ILIKE $1 OR barcode ILIKE $1
         LIMIT 30`,
        [`%${q}%`]
      );
    } else {
      result = await pool.query(
        `SELECT item_no, item_name as name, retail_price as price, barcode, 
                uom as unit, category_name, is_synced_app_web 
         FROM items`
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Lấy danh sách tháng có khuyến mãi
app.get('/api/months', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT month_table FROM promotions ORDER BY month_table');
    res.json(result.rows.map(r => r.month_table));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Lấy danh sách cửa hàng
app.get('/api/stores', async (req, res) => {
  try {
    const result = await pool.query('SELECT store_name, layer02 FROM stores ORDER BY store_name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Lấy danh sách sản phẩm khuyến mãi theo tháng và loại
app.get('/api/promotions', async (req, res) => {
  const { month, type, store_name, store_layer02 } = req.query;
  try {
    let query = 'SELECT * FROM promotions WHERE 1=1';
    const params = [];
    
    if (month) {
      params.push(month);
      query += ` AND month_table = $${params.length}`;
    }
    
    if (type && type !== 'Tất cả') {
      params.push(`%${type}%`);
      query += ` AND promo_type ILIKE $${params.length}`;
    }
    
    if (store_name) {
      let layerQuery = '';
      let sNameLikeIdx = params.length + 1;
      
      if (store_layer02) {
        params.push(`%${store_name}%`);
        params.push(store_layer02);
        layerQuery = `OR (TRIM(scope) = 'HN' AND $${params.length}::text = 'ALL-SKK Store')`;
      } else {
        params.push(store_name);
        const sNameIdx = params.length;
        params.push(`%${store_name}%`);
        sNameLikeIdx = params.length;
        layerQuery = `OR (TRIM(scope) = 'HN' AND (SELECT layer02 FROM stores WHERE store_name = $${sNameIdx}::text LIMIT 1) = 'ALL-SKK Store')`;
      }
      
      query += ` AND (
        TRIM(scope) = 'Toàn hệ thống' 
        ${layerQuery}
        OR scope ILIKE $${sNameLikeIdx}::text
      )`;
    }
    
    console.log('QUERY:', query);
    console.log('PARAMS:', params);
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('ERROR in /api/promotions:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ==========================================
// 1. CÁC API XÁC THỰC LARK OAUTH 2.0 (SSO)
// ==========================================

// Endpoint khởi tạo đăng nhập bằng Lark
app.get('/api/auth/lark/login', (req, res) => {
  const redirectUri = process.env.LARK_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/lark/callback`;
  const state = crypto.randomBytes(16).toString('hex');
  const authUrl = `https://open.larksuite.com/open-apis/authen/v1/authorize?app_id=${process.env.LARK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  res.redirect(authUrl);
});

// Endpoint Callback khi người dùng đồng ý uỷ quyền trên Lark
app.get('/api/auth/lark/callback', async (req, res) => {
  const code = req.query.code;
  const error = req.query.error;
  if (error || !code) {
    console.error('Lark OAuth callback error:', error);
    return res.redirect('/?error=' + encodeURIComponent(error || 'missing_code'));
  }

  try {
    // 1. Lấy app_access_token từ Lark
    const tokenRes = await fetch('https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: process.env.LARK_APP_ID,
        app_secret: process.env.LARK_APP_SECRET
      })
    });
    const tokenData = await tokenRes.json();
    if (tokenData.code !== 0) {
      throw new Error('Lỗi lấy app_access_token: ' + tokenData.msg);
    }
    const appAccessToken = tokenData.app_access_token;

    // 2. Đổi mã code lấy user_access_token qua OIDC endpoint
    const oidcRes = await fetch('https://open.larksuite.com/open-apis/authen/v1/oidc/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code
      })
    });
    const oidcData = await oidcRes.json();
    if (oidcData.code !== 0) {
      throw new Error('Lỗi đổi mã code Lark: ' + (oidcData.message || oidcData.msg));
    }
    const userAccessToken = oidcData.data.access_token;

    // 3. Lấy thông tin tài khoản người dùng Lark
    const userRes = await fetch('https://open.larksuite.com/open-apis/authen/v1/user_info', {
      headers: { 'Authorization': `Bearer ${userAccessToken}` }
    });
    const userData = await userRes.json();
    if (userData.code !== 0) {
      throw new Error('Lỗi lấy user_info từ Lark: ' + userData.msg);
    }
    const profile = userData.data;

    // 4. Lưu hoặc cập nhật người dùng vào bảng users
    // QUY TẮC: Mọi người dùng đăng nhập Lark đều được sử dụng ngay (vai trò mặc định là Nhân viên)
    // Riêng Hoàng Văn Hiếu luôn luôn là Quản trị viên (Admin)
    const isHieu = 
      (profile.email && profile.email.toLowerCase() === 'hieuhv2@sakukovietnam.com.vn') ||
      profile.open_id === 'ou_07ff157813f7a579760d5e076f2e0860' ||
      (profile.name && profile.name.trim() === 'Hoàng Văn Hiếu');

    const defaultRole = isHieu ? 'admin' : 'user';

    const upsertQuery = `
      INSERT INTO users (open_id, union_id, name, avatar_url, email, mobile, role, first_login_at, last_login_at, login_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), 1)
      ON CONFLICT (open_id) DO UPDATE SET
        name = EXCLUDED.name,
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
        email = COALESCE(EXCLUDED.email, users.email),
        mobile = COALESCE(EXCLUDED.mobile, users.mobile),
        role = CASE 
          WHEN $7 = 'admin' THEN 'admin'
          ELSE COALESCE(users.role, 'user')
        END,
        last_login_at = NOW(),
        login_count = users.login_count + 1
      RETURNING id, open_id, name, avatar_url, email, role, login_count;
    `;
    const dbUserRes = await pool.query(upsertQuery, [
      profile.open_id,
      profile.union_id || null,
      profile.name || profile.en_name || 'Người dùng Lark',
      profile.avatar_url || profile.avatar_thumb || null,
      profile.email || null,
      profile.mobile || null,
      defaultRole
    ]);
    const user = dbUserRes.rows[0];

    // 5. Ghi nhận log đăng nhập
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';
    await pool.query(
      `INSERT INTO user_access_logs (user_id, open_id, user_name, ip_address, user_agent, action, details)
       VALUES ($1, $2, $3, $4, $5, 'LOGIN', $6)`,
      [user.id, user.open_id, user.name, String(ip), String(ua), JSON.stringify({ via: 'lark_oauth', role: user.role })]
    );

    // 6. Cấp cookie phiên làm việc
    const token = createSessionToken(user);
    res.cookie('sakuko_session', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
      sameSite: 'lax'
    });

    res.redirect('/');
  } catch (err) {
    console.error('Lỗi quy trình Lark OAuth:', err);
    res.redirect('/?error=' + encodeURIComponent(err.message));
  }
});

// Endpoint kiểm tra người dùng hiện tại (Kèm cờ isAdmin)
app.get('/api/auth/me', async (req, res) => {
  const token = getCookie(req, 'sakuko_session');
  const session = verifySessionToken(token);
  if (!session) {
    return res.json({ loggedIn: false });
  }
  try {
    const userRes = await pool.query(
      'SELECT id, open_id, name, avatar_url, email, role, login_count, last_login_at FROM users WHERE id = $1',
      [session.id]
    );
    if (userRes.rows.length === 0) {
      return res.json({ loggedIn: false });
    }
    const user = userRes.rows[0];
    const isHieu = (user.email && user.email.toLowerCase() === 'hieuhv2@sakukovietnam.com.vn') ||
                   user.open_id === 'ou_07ff157813f7a579760d5e076f2e0860' ||
                   (user.name && user.name.trim() === 'Hoàng Văn Hiếu');
    const isAdmin = isHieu || user.role === 'admin';

    res.json({
      loggedIn: true,
      user: {
        ...user,
        role: isAdmin ? 'admin' : (user.role || 'user'),
        isAdmin
      }
    });
  } catch (err) {
    console.error('Lỗi truy vấn auth/me:', err);
    res.status(500).json({ loggedIn: false, error: 'DB error' });
  }
});

// Endpoint đăng xuất
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('sakuko_session', { path: '/' });
  res.json({ success: true });
});

// ==========================================
// 2. CÁC API TRACKING LƯỢT TRUY CẬP & HOẠT ĐỘNG
// ==========================================

// Ghi nhận một hành vi (ví dụ bấm in tem, xuất excel, xem trang...)
app.post('/api/tracking/action', async (req, res) => {
  const token = getCookie(req, 'sakuko_session');
  const session = verifySessionToken(token);
  const { action, details } = req.body;

  const userId = session ? session.id : null;
  const openId = session ? session.open_id : null;
  const userName = session ? session.name : 'Chưa đăng nhập';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const ua = req.headers['user-agent'] || '';

  try {
    await pool.query(
      `INSERT INTO user_access_logs (user_id, open_id, user_name, ip_address, user_agent, action, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, openId, userName, String(ip), String(ua), action || 'VISIT', JSON.stringify(details || {})]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Lỗi ghi tracking action:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Thống kê tổng hợp lượt truy cập & danh sách hoạt động (Chỉ Admin + Lọc theo ngày)
app.get('/api/tracking/stats', async (req, res) => {
  const token = getCookie(req, 'sakuko_session');
  const session = verifySessionToken(token);
  if (!session) {
    return res.status(401).json({ error: 'Chưa đăng nhập' });
  }

  // Kiểm tra quyền Admin
  const adminCheck = await pool.query('SELECT role, email, open_id, name FROM users WHERE id = $1', [session.id]);
  if (adminCheck.rows.length === 0) {
    return res.status(403).json({ error: 'Không tìm thấy tài khoản người dùng' });
  }
  const adminUser = adminCheck.rows[0];
  const isHieu = (adminUser.email && adminUser.email.toLowerCase() === 'hieuhv2@sakukovietnam.com.vn') ||
                 adminUser.open_id === 'ou_07ff157813f7a579760d5e076f2e0860' ||
                 (adminUser.name && adminUser.name.trim().includes('Hoàng Văn Hiếu'));
  
  if (!isHieu && adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Bạn không có quyền xem thống kê (chỉ dành cho Admin)' });
  }
  if (isHieu && adminUser.role !== 'admin') {
    await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [adminUser.id]);
  }

  // Bộ lọc theo ngày (startDate, endDate: YYYY-MM-DD)
  const { startDate, endDate } = req.query;
  let dateFilterLogs = '';
  let dateFilterPrints = '';
  let dateFilterLogins = '';
  const params = [];

  if (startDate && endDate) {
    params.push(`${startDate} 00:00:00`);
    params.push(`${endDate} 23:59:59`);
    dateFilterLogs = `AND created_at >= $1 AND created_at <= $2`;
    dateFilterPrints = `AND l.created_at >= $1 AND l.created_at <= $2`;
    dateFilterLogins = `WHERE action = 'LOGIN' AND created_at >= $1 AND created_at <= $2`;
  } else if (startDate) {
    params.push(`${startDate} 00:00:00`);
    dateFilterLogs = `AND created_at >= $1`;
    dateFilterPrints = `AND l.created_at >= $1`;
    dateFilterLogins = `WHERE action = 'LOGIN' AND created_at >= $1`;
  } else if (endDate) {
    params.push(`${endDate} 23:59:59`);
    dateFilterLogs = `AND created_at <= $1`;
    dateFilterPrints = `AND l.created_at <= $1`;
    dateFilterLogins = `WHERE action = 'LOGIN' AND created_at <= $1`;
  } else {
    dateFilterLogins = `WHERE action = 'LOGIN'`;
  }

  try {
    const totalUsersRes = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalLoginsRes = await pool.query(`SELECT COUNT(*) as count FROM user_access_logs ${dateFilterLogins}`, params);
    const totalPrintsRes = await pool.query(
      `SELECT COUNT(*) as count FROM user_access_logs WHERE action = 'PRINT_TEM' ${dateFilterLogs}`,
      params
    );

    const usersQuery = `
      SELECT 
        u.id, u.open_id, u.name, u.avatar_url, u.email, u.role, u.login_count, u.first_login_at, u.last_login_at,
        COALESCE(COUNT(l.id) FILTER (WHERE l.action = 'PRINT_TEM' ${dateFilterPrints}), 0)::int as print_count
      FROM users u
      LEFT JOIN user_access_logs l ON u.id = l.user_id
      GROUP BY u.id
      ORDER BY u.last_login_at DESC
    `;
    const usersRes = await pool.query(usersQuery, params);

    const logsQuery = `
      SELECT id, user_id, user_name, action, details, ip_address, created_at
      FROM user_access_logs
      WHERE 1=1 ${dateFilterLogs}
      ORDER BY created_at DESC
      LIMIT 1000
    `;
    const logsRes = await pool.query(logsQuery, params);

    res.json({
      summary: {
        totalUsers: parseInt(totalUsersRes.rows[0].count, 10),
        totalLogins: parseInt(totalLoginsRes.rows[0].count, 10),
        totalPrints: parseInt(totalPrintsRes.rows[0].count, 10)
      },
      users: usersRes.rows,
      recentLogs: logsRes.rows
    });
  } catch (err) {
    console.error('Lỗi lấy thống kê tracking:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Endpoint cho phép Admin phân quyền: thăng cấp Admin hoặc chuyển về Nhân viên
app.post('/api/tracking/set-role', async (req, res) => {
  const token = getCookie(req, 'sakuko_session');
  const session = verifySessionToken(token);
  if (!session) return res.status(401).json({ error: 'Chưa đăng nhập' });

  const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [session.id]);
  if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ Admin mới có quyền phân quyền người dùng' });
  }

  const { targetUserId, newRole } = req.body;
  if (!['admin', 'user'].includes(newRole)) {
    return res.status(400).json({ error: 'Quyền không hợp lệ' });
  }

  // Không cho phép hạ quyền Admin Hoàng Văn Hiếu
  const targetCheck = await pool.query('SELECT open_id, email, name FROM users WHERE id = $1', [targetUserId]);
  if (targetCheck.rows.length > 0) {
    const t = targetCheck.rows[0];
    if (t.open_id === 'ou_07ff157813f7a579760d5e076f2e0860' || (t.email && t.email.toLowerCase() === 'hieuhv2@sakukovietnam.com.vn')) {
      return res.status(400).json({ error: 'Không thể hạ quyền Admin của Hoàng Văn Hiếu' });
    }
  }

  try {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [newRole, targetUserId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Lỗi đổi quyền:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.listen(port, () => {
  console.log(`Server chạy tại http://localhost:${port}`);
});
