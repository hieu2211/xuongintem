const { spawn } = require('child_process');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const homeDir = process.env.USERPROFILE || process.env.HOME || '';
const LARK_CLI = fs.existsSync(path.join(homeDir, 'bin', 'lark-cli.exe'))
  ? path.join(homeDir, 'bin', 'lark-cli.exe') 
  : (fs.existsSync(path.join(homeDir, 'bin', 'lark-cli')) ? path.join(homeDir, 'bin', 'lark-cli') : 'lark-cli');

// Database config
const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'sakuko_tem',
};

// Lark Info
const WIKI_TOKEN = 'L9pmwxRLOidouSkV0PrlyS9NgPd';
const TABLE_ID = 'tblYYTZwWwrVpHEM';

function goiLark(apiPath, params, cb) {
  const args = ['api', 'GET', apiPath, '--as', 'user'];
  if (params) args.push('--params', JSON.stringify(params));
  const child = spawn(LARK_CLI, args, { env: process.env });
  let out = '', err = '';
  child.stdout.on('data', d => out += d.toString());
  child.stderr.on('data', d => err += d.toString());
  child.on('error', () => cb(new Error('lark-cli error')));
  child.on('close', () => {
    let j = null;
    try { j = JSON.parse(out); }
    catch { try { j = JSON.parse(err); } catch {} }
    if (!j) return cb(new Error('Invalid response from lark-cli: ' + out));
    
    // lark-cli returns the raw data payload directly on success, or an "error" object on failure
    if (j.error) return cb(new Error(j.error.message || JSON.stringify(j.error)));
    if (j.ok === false) return cb(new Error(JSON.stringify(j)));
    
    // If it's a success, j is the data itself
    cb(null, j);
  });
}

function layObjToken(wikiToken) {
  return new Promise((resolve, reject) => {
    goiLark(`/open-apis/wiki/v2/space/get_node?token=${wikiToken}`, null, (err, data) => {
      if (err) return reject(err);
      if (data && data.node && data.node.obj_token) resolve(data.node.obj_token);
      else reject(new Error('Cannot find obj_token from wiki token'));
    });
  });
}

function layRecords(appToken, tableId, pageToken = '') {
  return new Promise((resolve, reject) => {
    const params = { page_size: 500 };
    if (pageToken) params.page_token = pageToken;
    goiLark(`/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`, params, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
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
    
    console.log('Using Wiki token as App Token directly...');
    const appToken = WIKI_TOKEN;
    console.log('App Token:', appToken);

    let hasMore = true;
    let pageToken = '';
    let total = 0;

    console.log('Syncing records...');
    
    // Build insert query dynamically based on all possible keys in FIELD_MAP
    const allDbKeys = Array.from(new Set(Object.values(FIELD_MAP)));
    
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

        const keysToInsert = Object.keys(mapped);
        const valuesToInsert = Object.values(mapped);
        
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
