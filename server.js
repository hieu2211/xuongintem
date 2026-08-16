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
         FROM items 
         LIMIT 30`
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(port, () => {
  console.log(`Server chạy tại http://localhost:${port}`);
});
