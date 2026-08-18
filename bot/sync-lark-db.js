const { Client } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

// Database config
const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'sakuko_tem',
};

// Lark Info
const APP_ID = process.env.LARK_APP_ID || '';
// bot/sync-lark-db.js
const APP_SECRET = process.env.LARK_APP_SECRET;
const WIKI_TOKEN = process.env.LARK_WIKI_TOKEN || 'L9pmwxRLOidouSkV0PrlyS9NgPd';
const TABLE_ID = process.env.LARK_TABLE_ID || 'tblYYTZwWwrVpHEM';

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

async function layRecords(appToken, tableId, pageToken = '') {
  const url = new URL(`https://open.larksuite.com/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`);
  url.searchParams.append('page_size', '500');
  if (pageToken) url.searchParams.append('page_token', pageToken);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tenantAccessToken}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error('Lỗi lấy Records: ' + data.msg);
  return data;
}

const normalize = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const FIELD_MAP = {
  'mahang': 'item_no',
  'tenhang': 'item_name',
  'giabanle': 'retail_price',
  'dvt': 'uom',
  'barcode': 'barcode',
  'manganh': 'division_code',
  'tennganh': 'division_name',
  'manhom': 'group_code',
  'tennhom': 'group_name',
  'maloai': 'category_code',
  'tenloai': 'category_name',
  'ngaytao': 'created_date',
  'dongboappweb': 'is_synced_app_web',
  'kenhmua': 'purchase_channel',
  'trangthaikd': 'business_status',
  'maker': 'maker',
  'barcodethung': 'carton_barcode',
  'nhiemvu': 'mission',
  'quycach': 'pack_size',
  'vaitro': 'item_role',
  'giabanfc': 'fc_price',
  'block': 'block_status',
  'phanloaicongbo': 'declaration_type',
  'leadtime': 'lead_time_days',
  'vongdoi': 'shelf_life_days',
  'chieudaimm': 'length_mm',
  'chieurongmm': 'width_mm',
  'chieucaomm': 'height_mm',
  'cbm': 'cbm',
  'ncc': 'vendor_name',
  'dmhhtmdd': 'sjs_catalog_flag',
  'dmhhfc': 'fc_catalog_flag',
  'giaohangvekhos': 'delivery_to', // Kho/ST normalized usually removes symbols
  'giaohangvekhost': 'delivery_to',
  'hangtronthung': 'full_carton_flag',
  'phanloaincc': 'vendor_type',
  'nhomhangdieuchuyen': 'transfer_group',
  'phanloaimd': 'md_classification',
  'phanloaivat': 'vat_classification',
  'lieudung': 'dosage',
  'phancapdmhh': 'catalog_level',
  'hinhanhsp': 'image_file',
  'barcodecu': 'old_barcode',
  'maphu': 'sub_code',
  'tinhtranghanghoa': 'goods_status',
  'smin': 'min_stock_s',
  'mmin': 'min_stock_m',
  'lmin': 'min_stock_l',
  'tonmiinht': 'min_stock_current', // Typo handled
  'tonminht': 'min_stock_current',
  'piccuchuan': 'pic_cu'
};

const NUMERIC_FIELDS = [
  'retail_price', 'pack_size', 'fc_price', 'lead_time_days', 'shelf_life_days',
  'length_mm', 'width_mm', 'height_mm', 'cbm', 'dosage', 'min_stock_s',
  'min_stock_m', 'min_stock_l', 'min_stock_current'
];

function mapFields(fields) {
  const mapped = {};
  for (const [key, value] of Object.entries(fields)) {
    const k = normalize(key);
    const dbKey = FIELD_MAP[k];
    if (dbKey) {
      if (NUMERIC_FIELDS.includes(dbKey)) {
        mapped[dbKey] = parseFloat(value) || null;
      } else if (dbKey === 'is_synced_app_web') {
        mapped[dbKey] = (String(value).toLowerCase() === 'true' || value === true || value === 1);
      } else if (dbKey === 'created_date') {
        // Convert to YYYY/MM/DD or standard format if possible
        let dateVal = new Date(value);
        mapped[dbKey] = isNaN(dateVal.getTime()) ? null : dateVal.toISOString().split('T')[0];
      } else {
        mapped[dbKey] = String(value);
      }
    }
  }
  return mapped;
}

async function sync() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    console.log('Authenticating with Lark API...');
    await getTenantAccessToken();
    console.log('Got Tenant Access Token!');

    console.log('Using Wiki token as App Token directly...');
    const appToken = WIKI_TOKEN;
    console.log('App Token:', appToken);

    let hasMore = true;
    let pageToken = '';
    let total = 0;

    console.log('Syncing records...');
    
    // Fetch valid columns from DB
    const colResult = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'items'");
    const validColumns = colResult.rows.map(r => r.column_name);
    console.log('Valid DB columns:', validColumns);
    
    while (hasMore) {
      const data = await layRecords(appToken, TABLE_ID, pageToken);
      console.log('API response keys:', Object.keys(data));
      const items = data.items || data.data?.items || [];
      console.log('Number of items found in this page:', items.length);
      
      for (const item of items) {
        const fields = item.fields || {};
        const mapped = mapFields(fields);
        
        // Skip if no primary key (item_no)
        if (!mapped.item_no) continue;

        // Only insert columns that actually exist in the database
        const keysToInsert = Object.keys(mapped).filter(k => validColumns.includes(k));
        const valuesToInsert = keysToInsert.map(k => mapped[k]);
        
        if (keysToInsert.length === 0) continue;

        const setClause = keysToInsert.map(k => `${k} = EXCLUDED.${k}`).join(', ');
        
        const query = `
          INSERT INTO items (${keysToInsert.join(', ')}, updated_at)
          VALUES (${keysToInsert.map((_, i) => '$' + (i + 1)).join(', ')}, CURRENT_TIMESTAMP)
          ON CONFLICT (item_no) DO UPDATE SET
            ${setClause},
            updated_at = CURRENT_TIMESTAMP
        `;

        await client.query(query, valuesToInsert);
        total++;
      }

      hasMore = data.data && data.data.has_more;
      pageToken = data.data && data.data.page_token;
      console.log(`Synced ${total} records...`);
    }

    console.log(`Sync completed! Total records: ${total}`);
  } catch (err) {
    console.error('Sync failed:', err.message);
  } finally {
    await client.end();
  }
}

sync();
