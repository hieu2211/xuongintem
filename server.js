const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = 4200;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'sakuko_tem',
});

const bwipjs = require('bwip-js');

const barcodeCache = new Map();

// Proxy API kèm Cache bộ nhớ đệm và Fallback cục bộ
app.get('/api/barcode', async (req, res) => {
  const text = req.query.text;
  const scale = parseInt(req.query.scale) || 3;
  const height = parseInt(req.query.height) || 16;
  const textsize = parseInt(req.query.textsize) || 10;
  
  if (!text) {
      return res.status(400).send('Missing text parameter');
  }

  const cacheKey = `${text}_${scale}_${height}_${textsize}`;
  if (barcodeCache.has(cacheKey)) {
      res.set('Content-Type', 'image/png');
      res.set('Cache-Control', 'public, max-age=604800, immutable');
      return res.send(barcodeCache.get(cacheKey));
  }

  try {
      const url = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(text)}&scale=${scale}&height=${height}&includetext=true&textsize=${textsize}`;
      
      let buffer = null;
      try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              buffer = Buffer.from(arrayBuffer);
          }
      } catch (fetchErr) {
          // Metafloor API bị chậm hoặc lỗi mạng, tự động chuyển sang render cục bộ
      }

      // Fallback tự sinh mã vạch cục bộ bằng thư viện bwip-js nếu mạng bên ngoài lỗi
      if (!buffer) {
          buffer = await bwipjs.toBuffer({
              bcid: 'code128',
              text: text,
              scale: scale,
              height: height,
              includetext: true,
              textxalign: 'center',
              textsize: textsize
          });
      }

      // Lưu vào cache bộ nhớ đệm (giới hạn tối đa 5000 mã)
      if (barcodeCache.size > 5000) {
          const firstKey = barcodeCache.keys().next().value;
          barcodeCache.delete(firstKey);
      }
      barcodeCache.set(cacheKey, buffer);

      res.set('Content-Type', 'image/png');
      res.set('Cache-Control', 'public, max-age=604800, immutable');
      res.send(buffer);
  } catch (err) {
      console.error('Lỗi khi tạo barcode:', err);
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

app.listen(port, () => {
  console.log(`Server chạy tại http://localhost:${port}`);
});
