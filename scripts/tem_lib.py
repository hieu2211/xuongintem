#!/usr/bin/env python3
# Lõi dùng chung cho nhóm "Xưởng tem nhãn": đọc Excel/text, ánh xạ cột, sinh mã vạch, đổi mm→px, font, giá đẹp.
import os, re, unicodedata
from io import BytesIO
from PIL import Image, ImageFont

NAVY, MAGENTA, LINE, XAM = "#10285B", "#E0376F", "#c9d2e4", "#7a869c"
DPI = 300
FONTS = ["/System/Library/Fonts/Supplemental/Arial Bold.ttf",
         "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"]
FONTP = next((f for f in FONTS if os.path.exists(f)), None)

def mm2px(mm): return int(round(mm * DPI / 25.4))

def font(size): return ImageFont.truetype(FONTP, max(10, int(size)))

FONTU = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"   # có icon ★ ❀ ☀ (Arial Bold không có)
def font_u(size): return ImageFont.truetype(FONTU if os.path.exists(FONTU) else FONTP, max(10, int(size)))

def gia_dep(s):
    # nhân viên CVS góp ý 13/07: dùng "VND" thay "đ/₫" — thống nhất toàn chuỗi
    digits = re.sub(r"[^\d]", "", str(s))
    if not digits: return str(s).strip()
    return "{:,}".format(int(digits)).replace(",", ".") + " VND"

def _chuan_hoa(s):
    # "Tên sản phẩm" → "tensanpham" để so khớp tên cột không phụ thuộc dấu/hoa thường
    s = unicodedata.normalize("NFD", str(s))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").replace("đ", "d").replace("Đ", "d")
    return re.sub(r"[^a-z0-9]", "", s.lower())

# tên cột Excel → khoá chuẩn (thêm cột mới cho tương lai: chỉ cần thêm dòng)
COT = {
    "barcode": "barcode", "mavach": "barcode", "ma": "barcode",
    "tensanpham": "ten", "ten": "ten", "tensp": "ten", "sanpham": "ten",
    "tenjp": "ten_jp", "tennhat": "ten_jp", "tentiengnhat": "ten_jp", "jp": "ten_jp",
    "japanese": "ten_jp", "japanesename": "ten_jp", "tengoc": "ten_jp",
    "gianiemyet": "gia", "gia": "gia", "giaban": "gia",
    "giakhuyenmai": "gia_km", "giakm": "gia_km", "giasale": "gia_km",
    "khuyenmai": "ctkm", "ctkm": "ctkm", "noidungkhuyenmai": "ctkm", "chuongtrinhkhuyenmai": "ctkm",
    "soluong": "sl", "sl": "sl", "soluongtem": "sl",
    "thanhphan": "thanh_phan", "congdung": "cong_dung",
    "huongdansudung": "hdsd", "hdsd": "hdsd", "cachdung": "hdsd",
    "khoiluong": "khoi_luong", "trongluong": "khoi_luong", "dungtich": "khoi_luong",
    "xuatxu": "xuat_xu", "nhasanxuat": "nsx", "nsx": "nsx",
    "thongtinkhac": "khac", "khac": "khac", "ghichu": "khac",
    "handung": "han_dung", "handungngay": "han_dung", "hsd": "han_dung", "hansudung": "han_dung",
    "mamon": "ma_mon",
    "masp": "ma_noibo", "manoibo": "ma_noibo", "itemno": "ma_noibo", "maitem": "ma_noibo", "masanpham": "ma_noibo",
    "huytruochsd": "huy_truoc", "huytruoc": "huy_truoc", "huyhang": "huy_truoc", "huytruochsdngay": "huy_truoc",
    "cankg": "can_kg", "can": "can_kg", "khoiluongkg": "can_kg",
    "loaima": "loai_ma", "loai": "loai_ma", "kieuma": "loai_ma",
    "tungay": "tu_ngay", "ngaybatdau": "tu_ngay", "apdungtu": "tu_ngay", "kmtu": "tu_ngay",
    "denngay": "den_ngay", "ngayketthuc": "den_ngay", "apdungden": "den_ngay", "denhet": "den_ngay", "kmden": "den_ngay",
    "qr": "qr", "linkqr": "qr", "maqr": "qr", "link": "qr",
}

def chuan_loai(s):
    # "ITF-14" / "gs1-128" / "QR"... → khoá chuẩn; lạ/trống → auto
    s = re.sub(r"[^a-z0-9]", "", str(s or "").lower())
    return {"ean13": "ean13", "ean": "ean13", "code128": "code128",
            "itf14": "itf14", "itf": "itf14", "gs1128": "gs1", "gs1": "gs1", "qr": "qr"}.get(s, "auto")

def doc_excel(path):
    # đọc sheet đầu, hàng 1 là tiêu đề cột → list dict theo khoá chuẩn
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.worksheets[0]
    rows = ws.iter_rows(values_only=True)
    header = next(rows, None)
    if not header: return []
    keys = [COT.get(_chuan_hoa(h or ""), None) for h in header]
    out = []
    for r in rows:
        d = {}
        for k, v in zip(keys, r):
            if k and v is not None and str(v).strip():
                d[k] = str(v).strip() if not isinstance(v, float) or v % 1 else str(v)
                if isinstance(v, float) and v % 1 == 0: d[k] = str(int(v))
        if d.get("ten") or d.get("barcode"): out.append(d)
    wb.close()
    return out

def doc_text_temgia(path):
    # format dán tay cũ của tem giá: "Tên | Giá | SL | Mã vạch" (SL/mã vạch tuỳ chọn, đảo thứ tự được)
    out = []
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line: continue
        parts = [p.strip() for p in re.split(r"\||\t", line)]
        d = {"ten": parts[0]}
        if not d["ten"]: continue
        if len(parts) > 1 and parts[1]: d["gia"] = parts[1]
        for p in parts[2:]:
            mh = re.fullmatch(r"[hH]\s*(\d{1,2})", p)
            if mh: d["huy_truoc"] = mh.group(1); continue      # "H 2" = hủy trước HSD 2 ngày
            digits = re.sub(r"\D", "", p)
            if len(digits) >= 8: d["barcode"] = digits
            elif 4 <= len(digits) <= 7: d["ma_noibo"] = digits  # Item No (mã nội bộ 4-7 số)
            elif digits and 1 <= int(digits) <= 999: d["sl"] = digits
        out.append(d)
    return out

def doc_text_doan(path):
    # dán tay tem đồ ăn: "Tên | Giá | Mã món | Cân kg | Hạn dùng ngày | SL" (từ cột 3 không bắt buộc)
    out = []
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line: continue
        p = [x.strip() for x in re.split(r"\||\t", line)]
        d = {"ten": p[0]}
        if not d["ten"]: continue
        for i, k in enumerate(["gia", "ma_mon", "can_kg", "han_dung", "sl"], start=1):
            if len(p) > i and p[i]: d[k] = p[i]
        out.append(d)
    return out

def doc_bang(path):
    return doc_excel(path) if path.lower().endswith((".xlsx", ".xlsm")) else doc_text_temgia(path)

def nhan_sl(items, gioi_han):
    # nhân bản theo cột số lượng, chặn tổng
    out = []
    for d in items:
        try: sl = max(1, min(999, int(re.sub(r"\D", "", d.get("sl", "1")) or "1")))
        except Exception: sl = 1
        out.extend([d] * sl)
    if len(out) > gioi_han:
        raise ValueError(f"tổng {len(out)} tem (sau nhân số lượng) — tối đa {gioi_han}/lần")
    return out

_bc_cache = {}
def lam_barcode(code, rong=400, cao=115, loai="auto"):
    # loai: auto (12-13 số → EAN-13 chuẩn JAN, khác → Code128) | ean13 | code128 | itf14 (thùng carton) | gs1 (GS1-128 nhúng HSD/lô)
    code = str(code).strip()
    loai = chuan_loai(loai) if loai != "auto" else "auto"
    key = (code, rong, cao, loai)
    if key in _bc_cache: return _bc_cache[key]
    img = None
    try:
        import barcode as bclib
        from barcode.writer import ImageWriter
        so = re.sub(r"\D", "", code)
        if loai == "auto":
            loai = "ean13" if len(so) in (12, 13) else "code128"
        if loai == "ean13":
            bc = bclib.get("ean13", so[:12], writer=ImageWriter())
        elif loai == "itf14":
            if len(so) < 13: raise ValueError("ITF-14 cần 13-14 chữ số")
            bc = bclib.get("itf", so[:13], writer=ImageWriter())
        elif loai == "gs1":
            bc = bclib.get("gs1_128", re.sub(r"[()\s]", "", code), writer=ImageWriter())
        else:
            bc = bclib.get("code128", code, writer=ImageWriter())
        buf = BytesIO()
        bc.write(buf, options={"module_width": 0.33, "module_height": 11.0, "font_size": 10,
                               "text_distance": 4.5, "quiet_zone": 3.0, "dpi": DPI})
        buf.seek(0)
        img = Image.open(buf).convert("RGB")
        img.thumbnail((rong, cao))
    except Exception:
        img = None
    _bc_cache[key] = img
    return img

_qr_cache = {}
def lam_qr(data, canh=300):
    # QR navy trên nền trắng, phóng NEAREST giữ ô vuông sắc nét khi in
    data = str(data).strip()
    key = (data, canh)
    if key in _qr_cache: return _qr_cache[key]
    img = None
    try:
        import qrcode
        qr = qrcode.QRCode(box_size=10, border=2)
        qr.add_data(data); qr.make(fit=True)
        img = qr.make_image(fill_color=NAVY, back_color="white").convert("RGB")
        img = img.resize((canh, canh), Image.NEAREST)
    except Exception:
        img = None
    _qr_cache[key] = img
    return img

def tai_logo(path, max_w, max_h):
    if not path or path == "-" or not os.path.exists(path): return None
    lg = Image.open(path).convert("RGBA")
    lg.thumbnail((max_w, max_h))
    return lg

def fit(dr, text, size, max_w, min_size=18):
    while size > min_size:
        f = font(size)
        if dr.textlength(text, font=f) <= max_w: return f
        size -= 2
    return font(min_size)

def wrap(dr, text, f, max_w, max_lines=0):
    # bẻ dòng theo bề rộng thật; max_lines=0 là không giới hạn
    words, lines, cur = str(text).split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if dr.textlength(t, font=f) <= max_w or not cur: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    if max_lines and len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] += "…"
    return lines

KHO_TEM = {  # khổ tem giá/nhãn (mm) — thêm khổ mới chỉ cần thêm dòng
    "40x30": (40, 30), "50x30": (50, 30), "58x40": (58, 40),
    "70x50": (70, 50), "100x70": (100, 70),
}
def doc_kho(s, mac_dinh="a4"):
    s = (s or mac_dinh).lower().strip()
    if s == "a4": return "a4"
    if s in KHO_TEM: return KHO_TEM[s]
    m = re.match(r"^(\d{2,3})x(\d{2,3})$", s)   # khổ tuỳ chỉnh "RỘNGxCAO" mm
    if m:
        w, h = int(m.group(1)), int(m.group(2))
        if 20 <= w <= 210 and 15 <= h <= 297: return (w, h)
    return "a4"
