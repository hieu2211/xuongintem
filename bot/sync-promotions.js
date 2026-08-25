const { Client } = require('pg');

require('dotenv').config({ path: __dirname + '/../.env' });

const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'sakuko_tem',
};

const APP_ID = process.env.LARK_APP_ID || 'cli_aac4ca97b1389ee6';
const APP_SECRET = process.env.LARK_APP_SECRET || 'PmzXrYpLhKhmPBwgytplkw0NjYWcTBJC';
const BASE_TOKEN = 'NQRgbb3EWaZRf3sCUxOlmP4rgee'; // Base Khuyến Mãi

let tenantAccessToken = '';

async function getTenantAccessToken() {
  const res = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET })
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error('Lỗi lấy Token: ' + data.msg);
  tenantAccessToken = data.tenant_access_token;
}

async function getTables() {
  const res = await fetch(`https://open.larksuite.com/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables`, {
    headers: { 'Authorization': 'Bearer ' + tenantAccessToken }
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error('Lỗi lấy danh sách bảng: ' + data.msg);
  return data.data.items;
}

async function getRecords(tableId, pageToken = '') {
  let url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${tableId}/records?page_size=500`;
  if (pageToken) url += '&page_token=' + pageToken;
  
  const res = await fetch(url, {
    headers: { 'Authorization': 'Bearer ' + tenantAccessToken }
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error('Lỗi lấy dữ liệu bảng: ' + data.msg);
  return data.data;
}

function safeString(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object' && val.text) return val.text;
  if (typeof val === 'object' && val.name) return val.name; // For SingleSelect
  if (Array.isArray(val)) return val.map(v => v.name || v.text || v).join(', ');
  return String(val);
}

function safeNumeric(val) {
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

async function syncPromotions() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Create table if not exists (Drop and recreate to apply schema changes)
    await client.query(`DROP TABLE IF EXISTS promotions;`);
    await client.query(`
      CREATE TABLE promotions (
        id SERIAL PRIMARY KEY,
        month_table VARCHAR(255),
        barcode VARCHAR(255),
        item_name VARCHAR(255),
        category VARCHAR(255),
        retail_price VARCHAR(255),
        promo_price VARCHAR(255),
        promo_content TEXT,
        discount_percent NUMERIC,
        discount_amount VARCHAR(255),
        start_date VARCHAR(255),
        end_date VARCHAR(255),
        scope VARCHAR(255),
        fc_start_date VARCHAR(255),
        fc_end_date VARCHAR(255),
        promo_type VARCHAR(255),
        goods_status VARCHAR(255),
        promo_period VARCHAR(255),
        business_status VARCHAR(255)
      );
    `);

    console.log('Recreated promotions data table with new schema.');

    console.log('Authenticating with Lark API...');
    await getTenantAccessToken();
    console.log('Got Tenant Access Token!');

    console.log('Fetching list of tables in base...');
    const tables = await getTables();
    console.log(`Found ${tables.length} tables:`, tables.map(t => t.name).join(', '));

    let totalInserted = 0;

    for (const table of tables) {
      console.log(`\nSyncing table: ${table.name} (${table.table_id})`);
      let hasMore = true;
      let pageToken = '';
      let tableRecordCount = 0;

      while (hasMore) {
        const data = await getRecords(table.table_id, pageToken);
        const items = data.items || [];
        
        for (const item of items) {
          const f = item.fields || {};
          const barcode = safeString(f['Barcode']);
          
          if (!barcode) continue; 

          const item_name = safeString(f['Tên SP']);
          const category = safeString(f['Ngành hàng']);
          const retail_price = safeString(f['Giá BL']);
          const promo_price = safeString(f['Giá KM']);
          const promo_content = safeString(f['Nội dung CTKM']);
          const discount_percent = safeNumeric(f['% Giảm giá']);
          const discount_amount = safeString(f['Tiền giảm']);
          const start_date = safeString(f['Thời gian bắt đầu']);
          const end_date = safeString(f['Thời gian KT']);
          const scope = safeString(f['Phạm vi']);
          const fc_start_date = safeString(f['Thời gian AD FC']);
          const fc_end_date = safeString(f['THời gian KT FC']);
          
          // New fields
          const promo_type = safeString(f['Hình thức KM']);
          const goods_status = safeString(f['Tình trạng hàng hóa']);
          const promo_period = safeString(f['Kỳ KM']);
          const business_status = safeString(f['Trạng thái KD']);

          await client.query(`
            INSERT INTO promotions (
              month_table, barcode, item_name, category, retail_price, promo_price, 
              promo_content, discount_percent, discount_amount, start_date, end_date, 
              scope, fc_start_date, fc_end_date, promo_type, goods_status, promo_period, business_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          `, [
            table.name, barcode, item_name, category, retail_price, promo_price,
            promo_content, discount_percent, discount_amount, start_date, end_date,
            scope, fc_start_date, fc_end_date, promo_type, goods_status, promo_period, business_status
          ]);
          
          tableRecordCount++;
          totalInserted++;
        }

        hasMore = data.has_more;
        pageToken = data.page_token;
      }
      console.log(`Finished table ${table.name}. Inserted ${tableRecordCount} records.`);
    }

    console.log(`\nSync completed! Total records inserted across all tables: ${totalInserted}`);

  } catch (err) {
    console.error('Lỗi Sync:', err);
  } finally {
    await client.end();
  }
}

syncPromotions();
