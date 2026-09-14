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
const BASE_TOKEN = 'Gl0Bwcit8iLktlkZKyUlMRUbgHd'; // Base Store
const TABLE_ID = 'tblwva4IuWIvP17f';

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

async function getFields(tableId) {
  const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${tableId}/fields`;
  const res = await fetch(url, {
    headers: { 'Authorization': 'Bearer ' + tenantAccessToken }
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error('Lỗi lấy metadata field: ' + data.msg);
  
  const optionsMap = {};
  data.data.items.forEach(f => {
    // Normal select field
    if (f.property && f.property.options) {
      f.property.options.forEach(opt => {
        optionsMap[opt.id] = opt.name;
      });
    }
    // Formula field returning select
    if (f.property && f.property.type && f.property.type.ui_property && f.property.type.ui_property.options) {
      f.property.type.ui_property.options.forEach(opt => {
        optionsMap[opt.id] = opt.name;
      });
    }
  });

  // Load from target table for Lookup fields
  try {
    const url2 = `https://open.larksuite.com/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/tblmdxhDFEJvnyXC/fields`;
    const res2 = await fetch(url2, {
      headers: { 'Authorization': 'Bearer ' + tenantAccessToken }
    });
    const data2 = await res2.json();
    data2.data.items.forEach(f => {
      if (f.property && f.property.options) {
        f.property.options.forEach(opt => {
          optionsMap[opt.id] = opt.name;
        });
      }
    });
  } catch (err) {
    console.error('Lỗi lấy metadata target table:', err);
  }

  return optionsMap;
}

function safeString(val, optionsMap) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object' && val.text) return val.text;
  if (typeof val === 'object' && val.name) return val.name;
  if (Array.isArray(val)) {
    return val.map(v => {
      if (v.name || v.text) return v.name || v.text;
      return optionsMap[v] || v;
    }).join(', ');
  }
  return optionsMap[val] || String(val);
}

async function syncStores() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    await client.query(`DROP TABLE IF EXISTS stores;`);
    await client.query(`
      CREATE TABLE stores (
        id SERIAL PRIMARY KEY,
        store_name VARCHAR(255),
        status VARCHAR(255),
        branch VARCHAR(255),
        layer01 VARCHAR(255),
        layer02 VARCHAR(255)
      );
    `);
    console.log('Recreated stores table.');

    console.log('Authenticating with Lark API...');
    await getTenantAccessToken();
    console.log('Got Tenant Access Token!');

    console.log('Fetching fields metadata...');
    const optionsMap = await getFields(TABLE_ID);
    console.log('Mapped options count:', Object.keys(optionsMap).length);

    console.log(`Syncing table: ${TABLE_ID}`);
    let hasMore = true;
    let pageToken = '';
    let totalInserted = 0;

    while (hasMore) {
      const data = await getRecords(TABLE_ID, pageToken);
      const items = data.items || [];
      
      for (const item of items) {
        const f = item.fields || {};
        
        const store_name = safeString(f['StoreName'], optionsMap);
        const status = safeString(f['Trạng_Thái_ST'], optionsMap);
        const branch = safeString(f['Branch'], optionsMap);
        const layer01 = safeString(f['DWH_Store_Layer01_Mảng'], optionsMap);
        const layer02 = safeString(f['DWH_Store_Layer02_Khối'], optionsMap);
        
        if (!store_name) continue;
        
        // Filter logic:
        // status == '✔OPEN' 
        // AND (layer01 includes 'BL OFFLINE' OR layer01 includes 'CVS OFFLINE')
        if (status !== '✔OPEN') continue;
        if (!layer01 || (!layer01.includes('BL OFFLINE') && !layer01.includes('CVS OFFLINE'))) continue;

        await client.query(`
          INSERT INTO stores (
            store_name, status, branch, layer01, layer02
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          store_name, status, branch, layer01, layer02
        ]);
        
        totalInserted++;
      }

      hasMore = data.has_more;
      pageToken = data.page_token;
    }

    console.log(`\nSync completed! Total stores inserted: ${totalInserted}`);

  } catch (err) {
    console.error('Lỗi Sync:', err);
  } finally {
    await client.end();
  }
}

syncStores();
