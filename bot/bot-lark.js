#!/usr/bin/env node
// 🏷️ Bé Tem — trợ lý Lark của Xưởng tem nhãn Sakuko (bản ĐỘC LẬP, thuần 0 token).
// Nhắn trong Lark: "tem pocari | 5 | 58x30 | km" → tra file nguồn Lark → gọi app tem (cổng 4200) → gửi PDF vào chat.
// Chạy: node bot/bot-lark.js        (cần: app tem đang chạy cổng 4200 + lark-cli đã login trên máy này)
// Test não không cần Lark: node bot/bot-lark.js --test "in tem pocari 5 cái"
// KHÔNG phụ thuộc Claude/AI — hiểu câu bằng menu lệnh + FAQ + bộ bóc câu regex. Sửa bot/data/be-tem-kien-thuc.md = huấn luyện.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const XUONG = 'http://localhost:' + (process.env.TEM_PORT || 4200);   // app tem (Go)
const LARK_CLI = fs.existsSync(path.join(process.env.HOME || '', 'bin', 'lark-cli'))
  ? path.join(process.env.HOME, 'bin', 'lark-cli') : 'lark-cli';
const OUT_DIR = path.join(__dirname, '..', 'public', 'out');          // nơi app tem ghi PDF/PNG
const DATA_DIR = path.join(__dirname, 'data');
const daXuLy = new Set();          // chống trả lời trùng khi event phát lại

// tên + open_id của bot (nạp lúc khởi động) — để bóc "@<tên bot>" khỏi câu và bỏ qua tin của chính mình
let BOT_NAME = '', BOT_OPEN_ID = '';
function napTenBot() {
  const child = spawn(LARK_CLI, ['api', 'GET', '/open-apis/bot/v3/info', '--as', 'bot'], { env: process.env });
  let out = '';
  child.stdout.on('data', d => out += d.toString());
  child.on('error', () => {});
  child.on('close', () => {
    try {
      const j = JSON.parse(out);
      const b = j.bot || (j.data && j.data.bot);
      if (b && b.app_name) { BOT_NAME = b.app_name; BOT_OPEN_ID = b.open_id || ''; return log('🤖 tên bot:', BOT_NAME); }
    } catch {}
    setTimeout(napTenBot, 30000);  // chưa lấy được (mạng/login) → thử lại sau
  });
}

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// ---- TẦNG 1: MENU LỆNH — cú pháp cố định, code tự xử, 0 token (gõ có "/" hay không đều được) ----
const MENU = `📋 MENU LỆNH BÉ TEM — gõ lệnh để in ngay:

/tem <tên hàng> | <số tem> | <khổ> | <kiểu> — In tem giá (tra giá + mã vạch tự động)
      vd:  /tem pocari, bánh gạo | 5 | 58x30 | km
/temkm <nội dung> | <số tem> | <khổ> | <hình> | <màu> — Tem dán khuyến mại
      vd:  /temkm mua 2 tặng 1 | 24 | 58x37 | nhat | vang
/kho — Các khổ tem + khổ nào cài nẹp kệ CVS
/kieu — 19 kiểu tem (khuyến mại, Tết, 4 mùa, SALE đỏ-vàng...)
/nguon — Đang nối file dữ liệu nào
/huongdan — Cách dùng Xưởng tem trên máy cửa hàng
/help — Xem menu này

🧠 EM CÓ TRÍ NHỚ:
• "in lại" · "thêm 5 cái nữa" · "đổi khổ 58x30" · "kiểu tet" — em nhớ lệnh in trước đó của nhóm mình
• /macdinh khổ 58x30 kiểu km — từ giờ nhóm này in là em tự dùng khổ/kiểu đó (gõ "/macdinh xoá" để quên)
• In loạt LỚN (nhiều mặt hàng / nhiều tem) em sẽ hỏi lại — gõ "ok" để em chạy ạ 😄`;

const KHO_TXT = `📐 KHỔ TEM:
• Tem giá: 58x30 — nẹp kệ CVS (cao 3cm, chuẩn toàn chuỗi) · a4 (24 tem/trang, cắt dán) · 40x30 · 50x30 · 58x40
• Tem to đầu kệ: 60x45 · 90x60 · 60x90 · 140x100 · 210x100 · a4-2/a4-4/a4-6/a4-9 (A4 chia 2/4/6/9 tem lớn)
• Tem dán khuyến mại: 58x37 hình chữ nhật — cài nẹp kệ · 50x50 sao gai — dán sản phẩm
Khổ khác cứ gõ RỘNGxCAO (mm), vd 60x45 ạ.`;

const KIEU_TXT = `🎨 KIỂU TEM GIÁ:
• Chủ đề: thuong · km (khuyến mại: giá gạch + badge -%) · moi (hàng mới) · banchay
• Dịp lễ: khaitruong · tet · 83 · 2010 · trungthu · tuutruong · nhagiao · noel
• Trang trí 4 mùa Nhật: xuan · ha · thu · dong
• Màu nổi SALE: sale (đỏ-vàng) · vangdo · dotrang
Gõ tên kiểu vào cuối lệnh /tem là được ạ — vd: /tem pocari | 5 | 58x30 | tet`;

const HUONGDAN_TXT = `🖥 DÙNG XƯỞNG TEM TRÊN MÁY CỬA HÀNG:
1. Mở trình duyệt → địa chỉ Xưởng tem (cổng 4200) → chọn tab tem cần in
2. Tải file Excel mẫu (nút ⬇ đầu trang) → điền cột cần dùng → đính vào
3. Hoặc dán danh sách từng dòng: Tên | Giá | Số lượng | Mã vạch
4. In tỉ lệ 100% (không "fit to page") để mã vạch quét chuẩn ạ.
Còn nhắn em ở đây thì chỉ cần: /tem <tên hàng> — em gửi PDF tận tay 🌸`;

const THEME_ALIAS = {
  thuong: 'standard', standard: 'standard', km: 'promotion', khuyenmai: 'promotion', promotion: 'promotion',
  sale: 'dovang', dovang: 'dovang', vangdo: 'vangdo', dotrang: 'dotrang',
  moi: 'new', moive: 'new', new: 'new', banchay: 'bestseller', bestseller: 'bestseller',
  khaitruong: 'khaitruong', tet: 'tet', '83': '83', '2010': '2010', trungthu: 'trungthu',
  tuutruong: 'tuutruong', nhagiao: 'nhagiao', noel: 'noel', xuan: 'xuan', ha: 'ha', thu: 'thu', dong: 'dong',
};
const boDau = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

function noiDungKM(s) {            // câu thường → nội dung tem dán chuẩn
  const d = boDau(s);
  const m = d.match(/mua\s*(\d+)\s*tang\s*(\d+)/);
  if (m) return `MUA ${m[1]}|TẶNG ${m[2]}`;
  if (/dac biet/.test(d)) return 'KHUYẾN MẠI|ĐẶC BIỆT';
  if (/tung bung/.test(d)) return 'KHUYẾN MẠI|TƯNG BỪNG';
  if (/qua tang/.test(d)) return 'QUÀ TẶNG';
  return s.toUpperCase();
}
function xuLyMenu(text) {          // trả về ý định nếu khớp menu, null nếu rơi xuống FAQ/regex
  const t = text.trim().replace(/^\//, '');          // "/tem" hay "tem" đều nhận
  if (/^(menu|help|\?|lenh|lệnh)$/i.test(t)) return { viec: 'chat', tra_loi: MENU };
  if (/^(kho|khổ)$/i.test(t)) return { viec: 'chat', tra_loi: KHO_TXT };
  if (/^(kieu|kiểu|theme)$/i.test(t)) return { viec: 'chat', tra_loi: KIEU_TXT };
  if (/^(huongdan|hướng dẫn|huong dan)$/i.test(t)) return { viec: 'chat', tra_loi: HUONGDAN_TXT };
  if (/^(nguon|nguồn)$/i.test(t)) return { viec: 'nguon' };
  // tem DÁN khuyến mại — bắt TRƯỚC lệnh tem giá kẻo "tem khuyến mại..." bị nuốt
  const km = t.match(/^(?:in\s+)?tem\s*(?:km|khuyen\s?m[aạ][iị]|khuyến\s?mại)[\s:]+(.+)/i);
  if (km) {
    const phan = km[1].split('|').map(s => s.trim()).filter(Boolean);
    const y = { viec: 'in_temkm', so_luong: null, kho: '50x50', hinh: 'sao', mau: 'vang', xuat: 'pdf',
                tra_loi: 'Dạ, em in tem khuyến mại ngay ạ! 🎁' };
    let nd = phan[0] || '';
    for (const p of phan.slice(1)) {
      const k = boDau(p).replace(/[^a-z0-9x]/g, '');
      if (/^\d{1,3}$/.test(k)) y.so_luong = parseInt(k, 10);
      else if (/^\d{2,3}x\d{2,3}$/.test(k)) y.kho = k;
      else if (k === 'sao' || k === 'tron' || k === 'bong' || k === 'nhat') y.hinh = k;
      else if (k === 'do' || k === 'vang' || k === 'trang') y.mau = k;
      else if (k === 'png' || k === 'pdf') y.xuat = k;
    }
    if (phan.length === 1) {                       // viết liền 1 câu: bóc SL/khổ/hình/màu lẫn trong câu
      const sl = nd.match(/(\d{1,3})\s*(cái|tem|tờ)/i);
      if (sl) y.so_luong = parseInt(sl[1], 10);
      const kh = nd.match(/kh[ổo]\s*(\d{2,3}x\d{2,3})/i);
      if (kh) y.kho = kh[1];
      const sd = boDau(nd);
      if (/chu nhat|cai ke|nep ke/.test(sd)) y.hinh = 'nhat';
      else if (/sao gai|hinh sao|ngoi sao/.test(sd)) y.hinh = 'sao';
      else if (/tron/.test(sd)) y.hinh = 'tron';
      else if (/bong|thoai/.test(sd)) y.hinh = 'bong';
      if (/mau do|nen do|do chu trang/.test(sd)) y.mau = 'do';
      else if (/mau trang|nen trang|vien do/.test(sd)) y.mau = 'trang';
      else if (/vang/.test(sd)) y.mau = 'vang';
      if (/\bpng\b/.test(sd)) y.xuat = 'png';
    }
    y.noi_dung = noiDungKM(nd);
    return y;
  }
  const m = t.match(/^(?:in\s+)?tem[\s:]+(.+)/is);
  if (!m) return null;
  // "tem là gì / tem thế nào..." là CÂU HỎI, không phải lệnh in → nhường FAQ/AI trả lời
  if (!m[1].includes('|') && /^(la gi|the nao|nao|gi\b|bao nhieu|sao\b|\?)|(\?\s*$)/.test(boDau(m[1]).trim())) return null;
  const phan = m[1].split('|').map(s => s.trim());
  // kho/theme để null khi người dùng KHÔNG ghi rõ → tầng bộ nhớ điền mặc định của nhóm (nếu có)
  const y = { viec: 'in_tem', tukhoa: phan[0].split(',').map(s => s.trim()).filter(Boolean),
              so_luong: null, kho: null, theme: null, tra_loi: 'Dạ, em in ngay ạ! 🏷️' };
  if (!y.tukhoa.length) return { viec: 'chat', tra_loi: 'Dạ Sếp cho em xin tên/mã hàng với ạ — vd: tem pocari | 5 | 58x30' };
  for (const p of phan.slice(1)) {
    const k = boDau(p).replace(/[^a-z0-9x-]/g, '');
    if (/^\d{1,3}$/.test(k) && !THEME_ALIAS[k]) y.so_luong = parseInt(k, 10);
    else if (/^(a4|a4-\d|\d{2,3}x\d{2,3})$/.test(k)) y.kho = k;
    else if (THEME_ALIAS[k]) y.theme = THEME_ALIAS[k];
  }
  // không có dấu | mà viết tự nhiên "5 cái khổ 50x30 kiểu sale" → vẫn bắt được bằng regex
  if (phan.length === 1) {
    const tn = parseTuNhien(phan[0]);
    if (tn) Object.assign(y, tn);
  }
  return y;
}
function parseTuNhien(chuoi) {     // bóc SL/khổ/kiểu lẫn trong câu, phần còn lại là từ khoá
  const t = chuoi;
  const kho = (t.match(/kh[ổo]\s*(a4|\d{2,3}x\d{2,3})/i) || [])[1];
  const sl = parseInt((t.match(/(\d{1,3})\s*(cái|tem|tờ)/i) || [])[1], 10) || null;
  const td = boDau(t);
  let theme = null;
  if (/do\s*vang|sale/.test(td)) theme = 'dovang';
  else if (/vang\s*do/.test(td)) theme = 'vangdo';
  else if (/do\s*trang/.test(td)) theme = 'dotrang';
  else if (/khuyen mai|giam gia|\bkm\b/.test(td)) theme = 'promotion';
  else if (/khai truong/.test(td)) theme = 'khaitruong';
  else if (/moi ve/.test(td)) theme = 'new';
  else if (/ban chay/.test(td)) theme = 'bestseller';
  if (!kho && !sl && !theme) return null;
  const sach = t.replace(/kh[ổo]\s*(a4|\d{2,3}x\d{2,3})/gi, '').replace(/\d{1,3}\s*(cái|tem|tờ)/gi, '')
    .replace(/kiểu[^,]*|kieu[^,]*|đỏ vàng|vàng đỏ|đỏ trắng|khuyến mại|giảm giá|khai trương|mới về|bán chạy|sale/gi, '')
    .replace(/(^|\s)(nhé|nha|nhá|em|ạ|với|và|cho|chị|anh|giúp)(?=\s|$)/g, ' ')
    .replace(/\s{2,}/g, ' ').trim().replace(/[,.!?]+$/, '');
  return { tukhoa: sach.split(',').map(s => s.trim()).filter(Boolean),
           so_luong: sl, kho: kho || null, theme: theme || null };
}

// ---- CẤP "BỘ NHỚ" (đại phẫu Agent: chatbot biết LƯU TRỮ TRẢI NGHIỆM) ----
// 1) Nhớ hội thoại (RAM): lệnh in gần nhất từng nhóm → hiểu "in lại", "thêm 5 cái nữa", "đổi khổ 58x30"
// 2) Nhớ thói quen (file be-tem-nho.json): khổ/kiểu mặc định từng nhóm — "/macdinh khổ 58x30 kiểu km"
const nhoChat = new Map();                       // chatId → { cuoi: y, cho: {y, luc} }
const NHO_PATH = path.join(DATA_DIR, 'be-tem-nho.json');
function docNho() { try { return JSON.parse(fs.readFileSync(NHO_PATH, 'utf-8')); } catch { return {}; } }
function luuNho(n) { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(NHO_PATH, JSON.stringify(n, null, 2)); }

function lenhMacDinh(text, chatId) {             // "/macdinh khổ 58x30 kiểu km" | "/macdinh xoá"
  const t = boDau(text.trim().replace(/^\//, ''));
  if (!/^mac\s*dinh\b/.test(t)) return null;
  const nho = docNho();
  if (/xoa|quen|bo|reset/.test(t)) {
    delete nho[chatId]; luuNho(nho);
    return { viec: 'chat', tra_loi: 'Dạ, em đã quên mặc định của nhóm mình — về lại khổ a4, kiểu thường ạ.' };
  }
  const kho = (t.match(/\b(a4-\d|a4|\d{2,3}x\d{2,3})\b/) || [])[1];
  let theme = null;
  for (const w of t.split(/\s+/)) if (THEME_ALIAS[w.replace(/[^a-z0-9]/g, '')]) theme = THEME_ALIAS[w.replace(/[^a-z0-9]/g, '')];
  if (!kho && !theme) return { viec: 'chat', tra_loi: 'Dạ, Sếp ghi giúp em khổ/kiểu muốn đặt — vd: /macdinh khổ 58x30 kiểu km (hoặc "/macdinh xoá" để quên) ạ.' };
  nho[chatId] = Object.assign(nho[chatId] || {}, kho ? { kho } : {}, theme ? { theme } : {});
  luuNho(nho);
  const n = nho[chatId];
  return { viec: 'chat', tra_loi: `Dạ, em nhớ rồi ạ! Từ giờ nhóm mình in tem là em tự dùng${n.kho ? ' khổ ' + n.kho : ''}${n.theme ? ' · kiểu ' + n.theme : ''} 🧠` };
}
function apMacDinh(y, chatId) {                  // lệnh không ghi rõ khổ/kiểu → lấy thói quen nhóm, không có thì chuẩn chung
  if (y.viec !== 'in_tem') return y;
  const n = docNho()[chatId] || {};
  if (!y.kho) y.kho = n.kho || 'a4';
  if (!y.theme) y.theme = n.theme || 'standard';
  return y;
}
function noiTiep(text, chatId) {                 // câu tiếp nối dựa trên lệnh in gần nhất của nhóm
  const nc = nhoChat.get(chatId);
  if (!nc || !nc.cuoi) return null;
  const t = boDau(text.trim());
  if (/^(in lai|lai di|in tiep|lam lai)( di)?( nhe| nha| a| em)?$/.test(t))
    return Object.assign({}, nc.cuoi, { tra_loi: 'Dạ, em in lại y như lần trước ạ! 🔁' });
  const m1 = t.match(/^(?:in |them )?(\d{1,3})\s*(cai|tem|to)\s*nua$/);
  if (m1) return Object.assign({}, nc.cuoi, { so_luong: parseInt(m1[1], 10), tra_loi: `Dạ, em in thêm ${m1[1]} tem mỗi loại như lần trước ạ!` });
  const m2 = t.match(/^(?:doi\s+)?kho\s*(a4-\d|a4|\d{2,3}x\d{2,3})$/);
  if (m2) return Object.assign({}, nc.cuoi, { kho: m2[1], tra_loi: `Dạ, vẫn hàng đó nhưng đổi sang khổ ${m2[1]} ạ!` });
  const m3 = t.match(/^(?:doi )?kieu\s+([a-z0-9]+)$/);
  if (m3 && THEME_ALIAS[m3[1]]) return Object.assign({}, nc.cuoi, { theme: THEME_ALIAS[m3[1]], tra_loi: `Dạ, vẫn hàng đó nhưng đổi kiểu ${m3[1]} ạ!` });
  return null;
}

// ---- CẤP "TỰ TƯ DUY" (mức code): loạt in LỚN thì dừng hỏi lại, "ok" mới chạy ----
const NGUONG_HANG = 20, NGUONG_TEM = 120, HAN_CHO = 5 * 60 * 1000;
function choXacNhan(chatId, y, lyDo) {
  const nc = nhoChat.get(chatId) || {};
  nc.cho = { y, luc: Date.now() };
  nhoChat.set(chatId, nc);
  guiText(chatId, `🤔 ${lyDo} Anh chị gõ "ok" để em in, hoặc sửa lại lệnh cho gọn hơn ạ.`);
}
function layXacNhan(text, chatId) {
  if (!/^(ok|oke|okie|dong y|đồng ý|in di|in đi|yes|chay di|chạy đi)$/i.test(text.trim())) return null;
  const nc = nhoChat.get(chatId);
  if (!nc || !nc.cho || Date.now() - nc.cho.luc > HAN_CHO) return null;
  const y = nc.cho.y; nc.cho = null;
  y._daXacNhan = true;
  return y;
}

// ---- TẦNG 1.5: FAQ từ file kiến thức — SỬA FILE LÀ HUẤN LUYỆN, khớp là trả lời liền, 0 token ----
const KIENTHUC_PATH = path.join(DATA_DIR, 'be-tem-kien-thuc.md');
let FAQ = [], KIENTHUC_TXT = '';
function napKienThuc() {
  try {
    const txt = fs.readFileSync(KIENTHUC_PATH, 'utf-8');
    KIENTHUC_TXT = txt;
    FAQ = [];
    let hoi = null, dap = [];
    for (const line of txt.split('\n')) {
      const l = line.trim();
      if (/^hỏi\s*:/i.test(l)) {
        if (hoi && dap.length) FAQ.push({ hoi, dap: dap.join('\n') });
        hoi = l.replace(/^hỏi\s*:/i, '').split('|').map(s => s.trim()).filter(Boolean);
        dap = [];
      } else if (/^đáp\s*:/i.test(l)) dap.push(l.replace(/^đáp\s*:/i, '').trim());
      else if (l && !l.startsWith('#') && hoi && dap.length) dap.push(l);   // đáp nhiều dòng
    }
    if (hoi && dap.length) FAQ.push({ hoi, dap: dap.join('\n') });
    log('📚 nạp kiến thức:', FAQ.length, 'mục');
  } catch { FAQ = []; KIENTHUC_TXT = ''; log('⚠ chưa có file kiến thức', KIENTHUC_PATH); }
}
function timFAQ(text) {
  // khớp khi câu nhắn chứa (gần) đủ từ khoá của một cách-hỏi trong file kiến thức
  const td = ' ' + boDau(text) + ' ';
  let tot = null, diemTot = 0;
  for (const qa of FAQ) {
    for (const cau of qa.hoi) {
      const tu = boDau(cau).split(/\s+/).filter(w => w.length >= 3);
      if (tu.length < 2) continue;               // còn <2 từ khoá sau lọc → quá mơ hồ, dễ khớp bừa
      const trung = tu.filter(w => td.includes(w)).length;
      // phải trúng ĐỦ từ khoá (câu dài ≥5 từ mới được thiếu 1) — lỏng hơn là khớp bừa câu dài
      if ((trung === tu.length || (tu.length >= 5 && trung >= tu.length - 1)) && trung > diemTot) {
        tot = qa; diemTot = trung;
      }
    }
  }
  return tot;
}
napKienThuc();

// ---- TẦNG 2 (dự phòng): bộ bóc câu tự nhiên bằng regex — KHÔNG dùng AI, 0 token ----
function hieuY(tin) {
  const m = String(tin).match(/in\s+tem\s+(.+)/i);
  if (!m) return { viec: 'chat', tra_loi: 'Dạ, em là Bé Tem 🏷️ — gõ "menu" để xem lệnh nhanh, hoặc nhắn "in tem <tên hàng>" ạ!' };
  const tn = parseTuNhien(m[1]) || { tukhoa: [m[1].trim()], so_luong: null, kho: 'a4', theme: 'standard' };
  return Object.assign({ viec: 'in_tem', tra_loi: 'Dạ, em in ngay ạ!' }, tn);
}

// ---- TẦNG 3 (tuỳ chọn): não AI GROQ + Knowledge Base — kiến trúc "rules trước, AI sau" ----
// API Groq MIỄN PHÍ (console.groq.com) — không đụng thuê bao Claude của ai. Không có key → tự rơi về tầng regex.
function layGroqKey() {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  for (const f of ['.claude/.env', '.hermes/.env']) {
    try {
      for (const line of fs.readFileSync(path.join(process.env.HOME || '', f), 'utf-8').split('\n'))
        if (line.startsWith('GROQ_API_KEY=')) return line.split('=', 2)[1].trim().replace(/^["']|["']$/g, '');
    } catch {}
  }
  return '';
}
const GROQ_KEY = layGroqKey();
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// VÒNG LẶP AGENT (tư duy Loky Food v3): LLM được cấp TOOLS, tự tra dữ liệu THẬT rồi mới trả lời/hành động.
// Tối đa 5 vòng; tool "hành động" (in_tem / in_temkm / tra_loi) là điểm kết thúc vòng lặp.
const CONG_CU = [
  { type: 'function', function: { name: 'tra_hang',
    description: 'Tra file nguồn tồn kho Sakuko theo tên/mã sản phẩm. Trả về các mặt hàng khớp (Tên | Giá | Mã vạch) — DÙNG TOOL NÀY trước khi trả lời bất kỳ câu hỏi nào về hàng hoá/giá, tuyệt đối không bịa giá.',
    parameters: { type: 'object', properties: { tukhoa: { type: 'array', items: { type: 'string' }, description: 'từ khoá tên hoặc mã sản phẩm' } }, required: ['tukhoa'] } } },
  { type: 'function', function: { name: 'in_tem',
    description: 'RA LỆNH in tem giá kệ cho các sản phẩm (hệ thống tự tra nguồn, tạo PDF, gửi vào chat). Gọi khi người dùng muốn IN.',
    parameters: { type: 'object', properties: {
      tukhoa: { type: 'array', items: { type: 'string' } },
      so_luong: { type: 'integer', description: 'số tem mỗi sản phẩm' },
      kho: { type: 'string', description: '58x30 (nẹp kệ CVS) | a4 | a4-2/a4-4/a4-6/a4-9 | 40x30 | 50x30 | 58x40 | RỘNGxCAO mm' },
      theme: { type: 'string', description: 'standard|promotion|new|bestseller|khaitruong|tet|83|2010|trungthu|tuutruong|nhagiao|noel|dovang|vangdo|dotrang|xuan|ha|thu|dong' },
      tra_loi: { type: 'string', description: '1 câu xác nhận gửi kèm' } }, required: ['tukhoa'] } } },
  { type: 'function', function: { name: 'in_temkm',
    description: 'RA LỆNH in tem DÁN khuyến mại (sticker hàng-tặng-hàng, không gắn sản phẩm cụ thể).',
    parameters: { type: 'object', properties: {
      noi_dung: { type: 'string', description: 'vd "MUA 2|TẶNG 1" (dấu | là xuống dòng)' },
      so_luong: { type: 'integer' }, kho: { type: 'string', description: '58x37 cài nẹp kệ | 50x50' },
      hinh: { type: 'string', description: 'nhat (chữ nhật cài kệ) | sao | tron | bong' },
      mau: { type: 'string', description: 'do | vang | trang' },
      tra_loi: { type: 'string' } }, required: ['noi_dung'] } } },
  { type: 'function', function: { name: 'tra_loi',
    description: 'Gửi câu trả lời cuối cùng cho người dùng và KẾT THÚC (dùng cho chào hỏi, hỏi đáp, hoặc sau khi đã tra_hang xong).',
    parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } } },
];
async function thucThiCongCu(ten, thamSo) {       // tay chân cho vòng lặp agent — chỉ tool ĐỌC mới chạy ở đây
  if (ten === 'tra_hang') {
    try {
      const d = await traCuu((thamSo.tukhoa || []).map(String));
      const dong = d.text.split('\n');
      return `Tìm thấy ${d.soHang} mặt hàng trong nguồn "${d.tieude}":\n` + dong.slice(0, 10).join('\n') + (dong.length > 10 ? `\n...và ${dong.length - 10} mặt hàng nữa` : '');
    } catch (e) { return 'LỖI TRA NGUỒN: ' + e.message; }
  }
  return 'tool không tồn tại';
}
let _mockIdx = 0;
async function goiGroq(body) {
  if (process.env.BETEM_MOCK_GROQ) {              // kịch bản giả để test vòng lặp không cần mạng/key
    const kb = JSON.parse(fs.readFileSync(process.env.BETEM_MOCK_GROQ, 'utf-8'));
    return kb[Math.min(_mockIdx++, kb.length - 1)];
  }
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 20000);
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST', signal: ctl.signal,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + GROQ_KEY },
    body: JSON.stringify(body),
  });
  clearTimeout(timer);
  return r.json();
}
function lamSachY(y) {                            // AI chỉ được trả Ý ĐỊNH — validate trước khi cho chạy
  if (y.tukhoa && !Array.isArray(y.tukhoa)) y.tukhoa = [String(y.tukhoa)];
  if (y.kho && !/^(a4|a4-\d|\d{2,3}x\d{2,3})$/.test(String(y.kho))) y.kho = null;
  if (y.theme && !THEME_ALIAS[boDau(String(y.theme)).replace(/[^a-z0-9]/g, '')]) y.theme = null;
  if (y.hinh && !['nhat', 'sao', 'tron', 'bong'].includes(y.hinh)) y.hinh = 'nhat';
  if (y.mau && !['do', 'vang', 'trang'].includes(y.mau)) y.mau = 'vang';
  return y;
}
async function hieuYAI(tin) {
  if (!GROQ_KEY && !process.env.BETEM_MOCK_GROQ) return hieuY(tin);
  const heThong = `Bạn là "Bé Tem" — em trợ lý in tem nhãn của Sakuko (bán lẻ hàng Nhật nội địa, chuỗi CVS), xưng "em", gọi người nhắn là "anh/chị".
GIỌNG (văn hoá Sakuko): thân thiện dễ thương, tối đa 1 câu duyên mỗi tin; số liệu/hướng dẫn trả lời THẲNG; chưa chắc thì nói "em chưa chắc" và hướng anh chị hỏi Sếp Dung — TUYỆT ĐỐI không bịa.
${KIENTHUC_TXT ? 'KIẾN THỨC NỀN (ưu tiên trả lời theo đây):\n' + KIENTHUC_TXT.slice(0, 2500) + '\n' : ''}
CÁCH LÀM VIỆC: câu hỏi về hàng hoá/giá → GỌI tra_hang trước rồi trả lời theo dữ liệu thật; muốn in → gọi in_tem hoặc in_temkm; còn lại → tra_loi. LUÔN kết thúc bằng một trong: in_tem / in_temkm / tra_loi.`;
  const msgs = [{ role: 'system', content: heThong }, { role: 'user', content: String(tin).slice(0, 500) }];
  try {
    for (let vong = 0; vong < 5; vong++) {        // vòng lặp agent — tối đa 5 vòng
      const d = await goiGroq({ model: GROQ_MODEL, temperature: 0.2, max_tokens: 500, messages: msgs, tools: CONG_CU, tool_choice: 'auto' });
      const m = d.choices[0].message;
      const tc = (m.tool_calls || [])[0];
      if (!tc) return { viec: 'chat', tra_loi: (m.content || '').trim() || 'Dạ em nghe ạ!' };
      const ten = tc.function.name;
      let ts = {};
      try { ts = JSON.parse(tc.function.arguments || '{}'); } catch {}
      log('🔧 agent gọi tool:', ten, '(vòng ' + (vong + 1) + ')');
      if (ten === 'tra_loi') return { viec: 'chat', tra_loi: String(ts.text || '').trim() || 'Dạ em nghe ạ!' };
      if (ten === 'in_tem') return lamSachY(Object.assign({ viec: 'in_tem', tra_loi: 'Dạ, em in ngay ạ! 🏷️' }, ts));
      if (ten === 'in_temkm') return lamSachY(Object.assign({ viec: 'in_temkm', xuat: 'pdf', tra_loi: 'Dạ, em in tem khuyến mại ngay ạ! 🎁' }, ts));
      const kq = await thucThiCongCu(ten, ts);    // tool đọc (tra_hang) → nạp kết quả, cho AI suy nghĩ tiếp
      msgs.push({ role: 'assistant', content: m.content || '', tool_calls: [tc] });
      msgs.push({ role: 'tool', tool_call_id: tc.id, content: kq });
    }
    return { viec: 'chat', tra_loi: 'Dạ câu này hơi rối, em chưa chắc — anh chị hỏi Sếp Dung giúp em hoặc gõ "menu" xem lệnh nhanh ạ.' };
  } catch (e) { log('⚠ não Groq lỗi (' + String(e.message).slice(0, 60) + ') — dùng não dự phòng'); }
  return hieuY(tin);
}

// ---- CỔNG DỮ LIỆU LARK (nhúng trong bot — không cần server nào khác) ----
// Đọc file tồn kho/DMHH trên Lark qua lark-cli theo cấu hình bot/data/lark-nguon.json
// (file cấu hình tạo bằng Xưởng cũ hoặc chép tay theo mẫu trong BAN-GIAO.md — không commit).
const NGUON_PATH = path.join(DATA_DIR, 'lark-nguon.json');
let larkCache = { key: null, ts: 0, rows: null };

function goiLark(apiPath, params, cb, danhTinh) {
  const dt = danhTinh || 'user';                 // ưu tiên danh tính cá nhân, rơi về bot
  const args = ['api', 'GET', apiPath, '--as', dt];
  if (params) args.push('--params', JSON.stringify(params));
  const child = spawn(LARK_CLI, args, { env: process.env });
  let out = '', err = '';
  child.stdout.on('data', d => out += d.toString());
  child.stderr.on('data', d => err += d.toString());
  child.on('error', () => cb(new Error('Không chạy được lark-cli trên máy này (chưa cài).')));
  child.on('close', () => {
    let j = null;
    try { j = JSON.parse(out); }
    catch { try { j = JSON.parse(err); } catch {} }
    if (!j) return cb(new Error('lark-cli không trả dữ liệu hợp lệ: ' + (err || out).slice(0, 140)));
    if (j.ok === false) {
      if (dt === 'user') return goiLark(apiPath, params, cb, 'bot');
      return cb(new Error((j.error && j.error.message) || 'Lark từ chối truy cập — chạy: lark-cli auth login'));
    }
    if (j.code !== 0) return cb(new Error(j.msg || ('Lark trả lỗi ' + j.code)));
    cb(null, j.data);
  });
}
const chuanCot = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');
const COT_LARK = {
  barcode: 'barcode', mavach: 'barcode', masp2: 'barcode', ma: 'barcode',
  tensanpham: 'ten', tensp: 'ten', ten: 'ten', sanpham: 'ten',
  gia: 'gia', giabl: 'gia', gianiemyet: 'gia', giaban: 'gia', giale: 'gia',
  masp: 'ma_noibo', manoibo: 'ma_noibo', sku: 'ma_noibo',
};
const cotChu = i => { let s = ''; i += 1; while (i > 0) { s = String.fromCharCode(65 + (i - 1) % 26) + s; i = Math.floor((i - 1) / 26); } return s; };
function docNguon() { try { return JSON.parse(fs.readFileSync(NGUON_PATH, 'utf-8')); } catch { return null; } }
function luuNguon(n) { fs.mkdirSync(path.dirname(NGUON_PATH), { recursive: true }); fs.writeFileSync(NGUON_PATH, JSON.stringify(n, null, 2)); }

// dò 1 file sheet: lấy sheet đầu + tìm hàng tiêu đề + ánh xạ cột
function doSheet(token, cb) {
  goiLark(`/open-apis/sheets/v3/spreadsheets/${token}/sheets/query`, null, (e, data) => {
    if (e) return cb(new Error('Không đọc được sheet: ' + e.message));
    const sh = (data.sheets || [])[0];
    if (!sh) return cb(new Error('File không có sheet nào.'));
    const rowCount = (sh.grid_properties && sh.grid_properties.row_count) || 1000;
    goiLark(`/open-apis/sheets/v2/spreadsheets/${token}/values/${sh.sheet_id}!A1:Z8`, { valueRenderOption: 'ToString' }, (e2, d2) => {
      if (e2) return cb(new Error('Không đọc được dữ liệu: ' + e2.message));
      const rows = (d2.valueRange && d2.valueRange.values) || [];
      let tot = -1, hangTieuDe = -1, cols = null;
      rows.forEach((r, i) => {                       // hàng khớp nhiều tên cột quen thuộc nhất = hàng tiêu đề
        const m = {};
        r.forEach((c, j) => { const k = COT_LARK[chuanCot(c)]; if (k && !(k in m)) m[k] = j; });
        const diem = Object.keys(m).length;
        if (diem > tot) { tot = diem; hangTieuDe = i; cols = m; }
      });
      if (tot < 2 || !cols.ten) return cb(new Error('Không tìm thấy hàng tiêu đề có cột Tên SP (+ Giá/Barcode) trong 8 hàng đầu.'));
      cb(null, { sheetId: sh.sheet_id, hangTieuDe: hangTieuDe + 1, cols, rowCount });
    });
  });
}
// bật "tự file mới nhất": quét thư mục cha trên wiki, file có ngày mới nhất thì tự chuyển nguồn
function capNhatFileMoiNhat(nguon, cb) {
  if (!nguon.tuDong || !nguon.parentNode || !nguon.spaceId) return cb(nguon);
  if (nguon.kiemLuc && Date.now() - nguon.kiemLuc < 10 * 60 * 1000) return cb(nguon);
  goiLark(`/open-apis/wiki/v2/spaces/${nguon.spaceId}/nodes`, { parent_node_token: nguon.parentNode, page_size: 50 }, (e, data) => {
    nguon.kiemLuc = Date.now();
    if (e) { luuNguon(nguon); return cb(nguon); }
    const ds = (data.items || []).filter(n => n.obj_type === 'sheet');
    const diemNgay = n => { const m = (n.title || '').match(/(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})/); return m ? +(m[1] + m[2].padStart(2, '0') + m[3].padStart(2, '0')) : 0; };
    ds.sort((a, b) => diemNgay(b) - diemNgay(a) || (+b.obj_edit_time || 0) - (+a.obj_edit_time || 0));
    const moi = ds[0];
    if (!moi || moi.obj_token === nguon.token) { luuNguon(nguon); return cb(nguon); }
    doSheet(moi.obj_token, (e2, phan) => {
      if (e2) { luuNguon(nguon); return cb(nguon); }
      Object.assign(nguon, phan, { token: moi.obj_token, tieude: moi.title });
      luuNguon(nguon);
      larkCache = { key: null, ts: 0, rows: null };
      cb(nguon);
    });
  });
}
// lấy dữ liệu nguồn (tự đổi sang file mới nhất nếu bật, cache 10 phút)
function layRows(cb) {
  const nguon = docNguon();
  if (!nguon) return cb(new Error('Chưa nối file nguồn — tạo bot/data/lark-nguon.json (xem BAN-GIAO.md) giúp em ạ.'));
  capNhatFileMoiNhat(nguon, n => {
    const denIdx = Math.max(...Object.values(n.cols));
    const key = n.token + '/' + n.sheetId + '/' + denIdx;
    if (larkCache.key === key && Date.now() - larkCache.ts < 10 * 60 * 1000) return cb(null, larkCache.rows, n);
    const maxCol = cotChu(denIdx);
    const cuoi = Math.min(n.rowCount, n.hangTieuDe + 6000);
    goiLark(`/open-apis/sheets/v2/spreadsheets/${n.token}/values/${n.sheetId}!A${n.hangTieuDe + 1}:${maxCol}${cuoi}`,
      { valueRenderOption: 'ToString' }, (e, data) => {
      if (e) return cb(new Error('Không đọc được dữ liệu: ' + e.message));
      const rows = (data.valueRange && data.valueRange.values) || [];
      larkCache = { key, ts: Date.now(), rows };
      cb(null, rows, n);
    });
  });
}
// lọc theo mã/tên trong file nguồn → "Tên | Giá | 1 | Barcode [| Mã SP]" (y hệt /api/lark-lay cũ)
function traCuu(tukhoa) {
  return new Promise((resolve, reject) => {
    layRows((e, rows, nguon) => {
      if (e) return reject(e);
      const kq = [];
      for (const r of rows) {
        const o = {};
        for (const [k, j] of Object.entries(nguon.cols)) o[k] = String(r[j] == null ? '' : r[j]).trim();
        if (!o.ten) continue;
        const khop = tukhoa.some(t => {
          const ts = boDau(t);
          return (o.barcode && o.barcode === t) || (o.ma_noibo && o.ma_noibo === t) || boDau(o.ten).includes(ts);
        });
        if (khop) kq.push(o);
        if (kq.length >= 200) break;
      }
      if (!kq.length) return reject(new Error('Không thấy hàng nào khớp — thử mã khác hoặc từ khoá ngắn hơn.'));
      const text = kq.map(o => `${o.ten} | ${o.gia || ''} | 1 | ${o.barcode || ''}${o.ma_noibo ? ' | ' + o.ma_noibo : ''}`.replace(/\s+\|\s+\|/g, ' ||')).join('\n');
      resolve({ soHang: kq.length, text, tieude: nguon.tieude });
    });
  });
}

// ---- tay chân: gọi API app tem + gửi tin/file qua lark-cli ----
function goiLarkApi(args, cb) {
  const child = spawn(LARK_CLI, args, { env: process.env });
  let out = '', err = '';
  child.stdout.on('data', d => out += d.toString());
  child.stderr.on('data', d => err += d.toString());
  child.on('error', () => cb(new Error('không chạy được lark-cli')));
  child.on('close', () => {
    try { const j = JSON.parse(out || err); if (j.code === 0) return cb(null, j.data); cb(new Error(j.msg || JSON.stringify(j).slice(0, 120))); }
    catch { cb(new Error((err || out).slice(0, 120))); }
  });
}
function guiText(chatId, text) {
  goiLarkApi(['api', 'POST', '/open-apis/im/v1/messages', '--as', 'bot', '--params', '{"receive_id_type":"chat_id"}',
    '--data', JSON.stringify({ receive_id: chatId, msg_type: 'text', content: JSON.stringify({ text }) })],
    e => e && log('❌ gửi text:', e.message));
}
function guiAnh(chatId, filePath, cb) {
  goiLarkApi(['api', 'POST', '/open-apis/im/v1/images', '--as', 'bot',
    '--file', 'image=' + filePath, '--data', JSON.stringify({ image_type: 'message' })], (e, data) => {
    if (e || !data || !data.image_key) return cb(e || new Error('không lấy được image_key'));
    goiLarkApi(['api', 'POST', '/open-apis/im/v1/messages', '--as', 'bot', '--params', '{"receive_id_type":"chat_id"}',
      '--data', JSON.stringify({ receive_id: chatId, msg_type: 'image', content: JSON.stringify({ image_key: data.image_key }) })], cb);
  });
}
function guiFile(chatId, filePath, cb) {
  goiLarkApi(['api', 'POST', '/open-apis/im/v1/files', '--as', 'bot',
    '--file', 'file=' + filePath,
    '--data', JSON.stringify({ file_type: 'pdf', file_name: path.basename(filePath) })], (e, data) => {
    if (e || !data || !data.file_key) return cb(e || new Error('không lấy được file_key'));
    goiLarkApi(['api', 'POST', '/open-apis/im/v1/messages', '--as', 'bot', '--params', '{"receive_id_type":"chat_id"}',
      '--data', JSON.stringify({ receive_id: chatId, msg_type: 'file', content: JSON.stringify({ file_key: data.file_key }) })], cb);
  });
}

async function lamTem(y, chatId) {
  // 1) tra file nguồn Lark (nhúng trong bot)
  let d1;
  try { d1 = await traCuu(y.tukhoa || []); }
  catch (e) { return guiText(chatId, '⚠ ' + e.message); }
  // tự tư duy: loạt LỚN → dừng hỏi lại trước khi in (trừ khi đã "ok")
  const tong = d1.soHang * (y.so_luong || 1);
  if (!y._daXacNhan && (d1.soHang > NGUONG_HANG || tong > NGUONG_TEM)) {
    const vd = d1.text.split('\n').slice(0, 3).map(l => '• ' + l.split('|')[0].trim()).join('\n');
    return choXacNhan(chatId, y,
      `Lệnh này khớp ${d1.soHang} mặt hàng (~${tong} tem), hơi nhiều đó ạ:\n${vd}\n...`);
  }
  // 2) áp số lượng tem mỗi sản phẩm (cột 3)
  let text = d1.text;
  if (y.so_luong) text = text.split('\n').map(l => {
    const p = l.split('|').map(s => s.trim());
    if (p.length >= 3) p[2] = String(y.so_luong); else while (p.length < 3) p.push(p.length === 2 ? String(y.so_luong) : '');
    return p.join(' | ');
  }).join('\n');
  // 3) tạo tem PDF qua app tem (Go, cổng 4200)
  const fd = new FormData();
  fd.append('text', text); fd.append('kho', y.kho || 'a4'); fd.append('theme', y.theme || 'standard'); fd.append('xuat', 'pdf');
  const r2 = await fetch(XUONG + '/api/tem-gia', { method: 'POST', body: fd });
  const d2 = await r2.json();
  if (!d2.ok) return guiText(chatId, '⚠ ' + (d2.error || 'Tạo tem lỗi ạ.'));
  // 4) gửi PDF vào chat
  const fp = path.join(OUT_DIR, path.basename(d2.url));
  guiText(chatId, `${y.tra_loi || 'Dạ, tem đây ạ!'} 🏷️ ${d1.soHang} sản phẩm · ${d2.info || ''}`.trim());
  guiFile(chatId, fp, e => e ? guiText(chatId, '⚠ Gửi file lỗi: ' + e.message) : log('✅ đã gửi tem cho', chatId));
}

function xuLyTin(ev) {
  try {
    // lark-cli xuất sự kiện DẠNG PHẲNG (xem `lark-cli event schema im.message.receive_v1`):
    // {type, message_id, chat_id, chat_type: "p2p"|"group", message_type, sender_id, content}
    // content là CHỮ ĐỌC ĐƯỢC SẴN (không phải JSON); tin @ trong nhóm mang tiền tố "@<tên bot> " ngay trong content.
    if (!ev || !ev.message_id || ev.message_type !== 'text') return;
    if (BOT_OPEN_ID && ev.sender_id === BOT_OPEN_ID) return;         // bỏ qua tin của chính bot
    if (daXuLy.has(ev.message_id)) return;
    daXuLy.add(ev.message_id);
    if (daXuLy.size > 500) daXuLy.clear();
    let text = String(ev.content || '').replace(/@_user_\d+/g, '');
    const coNhac = text.includes('@');                                // nhóm: Lark chỉ đẩy tin có @bot tới đây
    if (BOT_NAME) text = text.split('@' + BOT_NAME).join(' ');        // bóc "@<tên bot>" khỏi câu
    text = text.replace(/^\s*@\S*\s*/, '').trim();                    // còn sót @gì-đó ở đầu → bỏ nốt
    if (!text) return;
    const laNhom = ev.chat_type === 'group';
    const duocGoi = coNhac || /bé tem|be tem|^in\s+tem/i.test(text);
    if (laNhom && !duocGoi) return;
    log('📩', String(ev.chat_id || '').slice(-6), ':', text.slice(0, 60));
    const y = phanTich(text, ev.chat_id);        // các tầng luật 0-token (kèm bộ nhớ)
    if (y && y._faq) return guiText(ev.chat_id, y.tra_loi);
    if (y) return thucHien(y, ev.chat_id);
    // không tầng luật nào khớp → tầng AI (Groq miễn phí; không key → regex dự phòng) — kiến trúc "rules trước, AI sau"
    log(GROQ_KEY ? '🤖 hỏi não Groq...' : '🧩 bộ bóc câu (chưa cắm não Groq)');
    hieuYAI(text).then(y2 => thucHien(apMacDinh(y2, ev.chat_id), ev.chat_id))
      .catch(e => log('❌ tầng AI:', e.message));
  } catch (e) { log('❌ xử lý tin:', e.message); }
}

// não tổng CÁC TẦNG LUẬT: xác nhận chờ → mặc định nhóm → menu lệnh → câu tiếp nối (nhớ) → FAQ.
// Không khớp → trả null để tầng AI (hieuYAI) xử — "rules trước, AI sau".
function phanTich(text, chatId) {
  const xn = layXacNhan(text, chatId);
  if (xn) { log('✅ đã xác nhận, chạy loạt lớn'); return xn; }
  const md = lenhMacDinh(text, chatId);
  if (md) { log('🧠 lệnh mặc định'); return md; }
  const menu = xuLyMenu(text);
  if (menu) { log('⚡ khớp menu'); return apMacDinh(menu, chatId); }
  const nt = noiTiep(text, chatId);
  if (nt) { log('🧠 câu tiếp nối (nhớ lệnh trước)'); return nt; }
  // câu bắt đầu bằng "in ..." là Ý ĐỊNH HÀNH ĐỘNG → không để FAQ trả lời lý thuyết, nhường tầng AI/regex
  if (!/^in\s/.test(boDau(text.trim()))) {
    const faq = timFAQ(text);
    if (faq) { log('📚 khớp FAQ'); return { viec: 'chat', tra_loi: faq.dap, _faq: true }; }
  }
  return null;
}

function thucHien(y, chatId) {
  if (y.viec === 'in_tem' || y.viec === 'in_temkm') {          // nhớ lệnh in gần nhất của nhóm
    const nc = nhoChat.get(chatId) || {};
    nc.cuoi = Object.assign({}, y); delete nc.cuoi._daXacNhan;
    nhoChat.set(chatId, nc);
  }
  if (y.viec === 'in_tem') return lamTem(y, chatId).catch(e => guiText(chatId, '⚠ Lỗi: ' + e.message));
  if (y.viec === 'in_temkm') return lamTemKM(y, chatId).catch(e => guiText(chatId, '⚠ Lỗi: ' + e.message));
  if (y.viec === 'nguon') return xemNguon(chatId);
  guiText(chatId, y.tra_loi || 'Dạ em nghe ạ!');
}
async function lamTemKM(y, chatId) {
  const fd = new FormData();
  fd.append('text', y.noi_dung || 'MUA 1|TẶNG 1');
  fd.append('hinh', y.hinh || 'sao'); fd.append('mau', y.mau || 'vang');
  fd.append('kich', y.kho || '50x50'); fd.append('sl', String(y.so_luong || 24)); fd.append('xuat', y.xuat || 'pdf');
  const r = await fetch(XUONG + '/api/tem-tang', { method: 'POST', body: fd });
  const d = await r.json();
  if (!d.ok) return guiText(chatId, '⚠ ' + (d.error || 'Tạo tem khuyến mại lỗi ạ.'));
  guiText(chatId, `${y.tra_loi || 'Dạ, tem khuyến mại đây ạ!'} 🎁 ${d.info || ''}`.trim());
  if (d.items) {                                   // PNG 1 tem → gửi dạng ảnh xem ngay trong chat
    const fp = path.join(OUT_DIR, path.basename(d.items[0].url));
    guiAnh(chatId, fp, e => e ? guiText(chatId, '⚠ Gửi ảnh lỗi: ' + e.message) : log('✅ đã gửi ảnh tem KM cho', chatId));
  } else {
    const fp = path.join(OUT_DIR, path.basename(d.url));
    guiFile(chatId, fp, e => e ? guiText(chatId, '⚠ Gửi file lỗi: ' + e.message) : log('✅ đã gửi tem KM cho', chatId));
  }
}
function xemNguon(chatId) {
  const n = docNguon();
  guiText(chatId, n && n.tieude ? `📡 Em đang nối nguồn: ${n.tieude}` : '📡 Chưa nối file nguồn nào — tạo bot/data/lark-nguon.json (xem BAN-GIAO.md) giúp em ạ.');
}

// ---- chế độ test não: node bot/bot-lark.js --test "câu 1" "câu 2" ... (mô phỏng hội thoại 1 nhóm, không gửi Lark) ----
if (process.argv[2] === '--test') {
  (async () => {
    const cacTin = process.argv.slice(3).length ? process.argv.slice(3) : ['in tem pocari 5 cái khổ 50x30'];
    const CHAT_TEST = 'oc_test_console';
    for (const tin of cacTin) {
      console.log('\n👤 ' + tin);
      let y = phanTich(tin, CHAT_TEST);
      if (!y) {                                                // không tầng luật nào khớp → tầng AI
        console.log(GROQ_KEY ? '   (🤖 hỏi não Groq...)' : '   (🧩 chưa cắm não Groq — regex dự phòng)');
        y = apMacDinh(await hieuYAI(tin), CHAT_TEST);
      }
      if (y.viec === 'in_tem' || y.viec === 'in_temkm') {      // như thucHien: lưu trí nhớ, không chạy thật
        const nc = nhoChat.get(CHAT_TEST) || {};
        nc.cuoi = Object.assign({}, y); delete nc.cuoi._daXacNhan;
        nhoChat.set(CHAT_TEST, nc);
      }
      console.log('🤖 ' + JSON.stringify(y, null, 2).split('\n').join('\n   '));
    }
    process.exit(0);
  })();
} else {
  log('🏷️ Bé Tem (bản độc lập, 0 token) thức dậy — nghe tin nhắn Lark...');
  napTenBot();
  const nghe = () => {
    const child = spawn(LARK_CLI, ['event', 'consume', 'im.message.receive_v1', '--as', 'bot', '--quiet'], { env: process.env });
    let dem = '';
    child.stdout.on('data', d => {
      dem += d.toString();
      let i;
      while ((i = dem.indexOf('\n')) >= 0) {
        const line = dem.slice(0, i).trim(); dem = dem.slice(i + 1);
        if (!line) continue;
        try { xuLyTin(JSON.parse(line)); } catch {}
      }
    });
    child.stderr.on('data', d => { const s = d.toString().trim(); if (s) log('event:', s.slice(0, 160)); });
    child.on('close', code => { log('⚠ luồng sự kiện đóng (code ' + code + ') — nghe lại sau 10 giây'); setTimeout(nghe, 10000); });
    child.on('error', () => { log('❌ không chạy được lark-cli — cài + login rồi chạy lại'); process.exit(1); });
  };
  nghe();
}
