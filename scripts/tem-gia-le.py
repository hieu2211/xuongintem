#!/usr/bin/env python3
# Tem giá kệ: python3 tem-gia-le.py <input.xlsx|.txt> <dest.pdf> [logo|-] [khổ] [theme] [xuất] [ô bắt đầu] [xem thử 0/1] [in hsd 0/1] [từ ngày] [đến ngày] [badge]
#   ô bắt đầu: với khổ a4/a4-N — in từ ô thứ N để tận dụng tờ tem đã cắt dở
#   xem thử:   1 = chỉ render tem đầu tiên ra PNG để xem trước khi in cả loạt
#   in hsd:    1 = in dòng NSX/HSD — cột "Hạn dùng (ngày)" là số N thì HSD = hôm nay + N ngày, là chuỗi thì in nguyên văn
#   khổ:   a4 (24 tem/trang 3×8) | a4-2 / a4-4 / a4-6 / a4-9 (A4 chia 2/4/6/9 tem LỚN đầu kệ)
#          | 40x30 | 50x30 | 58x30 | 58x40 | "RỘNGxCAO" mm tuỳ chỉnh (mỗi tem 1 trang PDF)
#   theme: standard | promotion (giá KM + giá gạch + CTKM) | new | bestseller | seasonal (màu + icon + nền riêng)
#   xuất:  pdf | png (png: mỗi tem 1 ảnh, tối đa 24 — in nhanh/gửi Zalo)
#   từ/đến ngày: áp hiệu lực KM cho CẢ LOẠT (dòng nào có sẵn Từ/Đến riêng thì giữ của dòng); "-" hoặc trống = bỏ qua
#   badge: chữ tự do in trên dải đầu tem (HOT / NEW / TOP GIÁ SỐC...) — đè chữ dải của theme; "-" hoặc trống = bỏ qua
# Excel theo mẫu mau-tem-nhan.xlsx; text dán tay: "Tên | Giá | SL | Mã vạch". Trường trống tự ẩn.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from PIL import Image, ImageDraw
    import tem_lib as T
    if len(sys.argv) < 3: print("ERR: thiếu tham số"); sys.exit(2)
    srcp, dest = sys.argv[1], sys.argv[2]
    logop = sys.argv[3] if len(sys.argv) > 3 else "-"
    kho_raw = (sys.argv[4] if len(sys.argv) > 4 else "a4").strip().lower()
    # a4-2 / a4-4 / a4-6 / a4-9 = A4 chia 2/4/6/9 tem LỚN (đầu kệ, băng rôn giá) — lưới cột×hàng tương ứng
    A4_CHIA = {"a4": (3, 8), "a4-2": (1, 2), "a4-4": (2, 2), "a4-6": (2, 3), "a4-9": (3, 3)}
    if kho_raw in A4_CHIA:
        kho, (A4_COLS, A4_ROWS) = "a4", A4_CHIA[kho_raw]
    else:
        kho = T.doc_kho(kho_raw)
        A4_COLS, A4_ROWS = 3, 8
    theme = (sys.argv[5] if len(sys.argv) > 5 else "standard").lower()
    xuat = (sys.argv[6] if len(sys.argv) > 6 else "pdf").lower()
    if not os.path.exists(srcp): print("ERR: không thấy dữ liệu"); sys.exit(3)
    if not T.FONTP: print("ERR: máy không có font Arial"); sys.exit(5)

    batdau = int(sys.argv[7]) if len(sys.argv) > 7 and str(sys.argv[7]).isdigit() else 1
    xemthu = len(sys.argv) > 8 and sys.argv[8] == "1"
    in_hsd = len(sys.argv) > 9 and sys.argv[9] == "1"
    def _arg(i):
        v = sys.argv[i].strip() if len(sys.argv) > i else ""
        return "" if v == "-" else v
    tu_loat, den_loat = _arg(10), _arg(11)   # hiệu lực KM áp cả loạt
    badge = _arg(12)                          # chữ tự do trên dải đầu tem

    import re as _re
    from datetime import datetime, timedelta
    _now = datetime.now()
    def dong_hsd(item):
        hd = str(item.get("han_dung", "")).strip()
        if _re.fullmatch(r"\d{1,3}", hd):     # số ngày → tự tính từ lúc in
            return f"NSX {_now.strftime('%d/%m %H:%M')} · HSD {(_now + timedelta(days=int(hd))).strftime('%d/%m/%Y')}"
        if hd:                                 # ngày ghi sẵn → in nguyên văn
            return f"NSX {_now.strftime('%d/%m/%Y')} · HSD {hd}"
        return f"NSX {_now.strftime('%d/%m/%Y')}"

    items = T.nhan_sl(T.doc_bang(srcp), 500)
    if not items: print("ERR: chưa có dòng sản phẩm nào (xem file Excel mẫu)"); sys.exit(4)
    if tu_loat or den_loat:                   # áp từ–đến ngày cho cả loạt, dòng có sẵn thì ưu tiên của dòng
        for it in items:
            if tu_loat and not str(it.get("tu_ngay", "")).strip(): it["tu_ngay"] = tu_loat
            if den_loat and not str(it.get("den_ngay", "")).strip(): it["den_ngay"] = den_loat
    if xemthu: items, xuat = items[:1], "png"
    if xuat == "png" and len(items) > 24: print("ERR: xuất PNG tối đa 24 tem — nhiều hơn hãy xuất PDF"); sys.exit(6)

    # kích thước 1 tem (px 300dpi)
    if kho == "a4":
        W_A4, H_A4, M = 2480, 3508, 70
        COLS, ROWS = A4_COLS, A4_ROWS
        cw, ch = (W_A4 - 2 * M) // COLS, (H_A4 - 2 * M) // ROWS
        PADC = 18
        tw, th = cw - 2 * PADC, ch - 2 * PADC
    else:
        tw, th = T.mm2px(kho[0]), T.mm2px(kho[1])

    logo = T.tai_logo(logop, int(tw * 0.7), max(30, int(th * 0.2)))

    # mỗi chủ đề: (chữ trên dải — None là KHÔNG có dải, chỉ trang trí; màu dải/viền; nền tem; hoạ tiết; màu hoạ tiết)
    THEMES = {
        "promotion":  ("KHUYẾN MẠI",    T.MAGENTA, "#ffffff", None, None),
        "new":        ("☀ HÀNG MỚI VỀ", "#17934f", "#f2fbf5", None, None),
        "bestseller": ("★ BÁN CHẠY",    "#e8890c", "#fff8ec", None, None),
        # 4 mùa Nhật = TRANG TRÍ (màu + hoạ tiết, không dải tiêu đề — tem vẫn hiện logo/SAKUKO)
        "xuan":       (None, "#ec6fa8", "#fdf2f8", "❀",  "#f6c6db"),   # sakura
        "ha":         (None, "#0e9bb5", "#eefafc", "☀",  "#b7e2ec"),   # nắng biển
        "thu":        (None, "#c96a1f", "#fdf5ec", "❋",  "#eecfa9"),   # lá momiji
        "dong":       (None, "#4a7dc4", "#f0f6fd", "❄",  "#c6d9f1"),   # tuyết
        # dịp đặc biệt (brand Sakuko: không dùng đỏ — Tết dùng vàng kim hoa mai, Noel xanh thông)
        "khaitruong": ("❈ KHAI TRƯƠNG",        "#E0376F", "#fdf0f6", "❈", "#f5c3d8"),  # pháo hoa magenta
        "tet":        ("❁ CHÚC MỪNG NĂM MỚI",  "#c98a12", "#fdf8ea", "❁", "#eedaa4"),  # hoa mai vàng kim
        "83":         ("✿ MỪNG NGÀY 8/3",      "#b74fa3", "#faf0f8", "✿", "#e6c4de"),  # hoa tím hồng
        "2010":       ("❀ MỪNG NGÀY 20/10",    "#cf3d7d", "#fdeff6", "❀", "#f3c6da"),  # hoa hồng sen
        "trungthu":   ("☾ TẾT TRUNG THU",      "#d98e1a", "#fdf7e8", "☾", "#f0d9a8"),  # trăng vàng
        "tuutruong":  ("✎ MÙA KHAI TRƯỜNG",    "#2563b8", "#eef4fd", "✎", "#bdd3f0"),  # bút xanh
        "nhagiao":    ("❁ NGÀY NHÀ GIÁO 20/11","#2e5b4a", "#eef6f1", "❁", "#c4dcd1"),  # xanh bảng viết
        "noel":       ("☃ GIÁNG SINH",         "#1e7a46", "#eefaf2", "☃", "#bfe3cc"),  # xanh thông + người tuyết
        # màu nổi kiểu tem SALE siêu thị (Sếp duyệt dùng đỏ riêng cho tem điểm bán 12/07/2026)
        # phần tử thứ 6 = bảng màu chữ: ten / gia / sk (chữ SAKUKO) / phu (dòng NSX-HSD)
        "dovang":  (None, "#f8c200", "#d81f26", None, None, {"ten": "#ffd200", "gia": "#ffd200", "sk": "#ffffff", "phu": "#ffe3a8"}),
        "vangdo":  (None, "#d81f26", "#ffd200", None, None, {"ten": "#c8102e", "gia": "#d81f26", "sk": "#c8102e", "phu": "#8a4a00"}),
        "dotrang": (None, "#ffffff", "#d81f26", None, None, {"ten": "#ffffff", "gia": "#ffffff", "sk": "#ffffff", "phu": "#ffd7d7"}),
    }
    THEMES["seasonal"] = THEMES["xuan"]   # tương thích tên cũ
    chu_de = THEMES.get(theme)
    mau_chu = chu_de[5] if chu_de and len(chu_de) > 5 else {}
    mau_ten = mau_chu.get("ten", T.NAVY)
    mau_gia = mau_chu.get("gia", T.MAGENTA)
    mau_sk = mau_chu.get("sk", T.MAGENTA)
    mau_phu = mau_chu.get("phu", "#44506b")

    def don_gia(item):
        # đơn giá quy đổi chuẩn siêu thị Nhật: "≈25.000 ₫/100g" — tính từ cột Khối lượng (180g/500ml/1.5l...)
        kl = str(item.get("khoi_luong", "")).strip().lower().replace(",", ".")
        m = _re.search(r"(\d+(?:\.\d+)?)\s*(kg|ml|g|l)\b", kl)
        if not m: return ""
        so, dv = float(m.group(1)), m.group(2)
        if so <= 0: return ""
        if dv == "kg": so, dv = so * 1000, "g"
        if dv == "l": so, dv = so * 1000, "ml"
        g = int(_re.sub(r"\D", "", str(item.get("gia", ""))) or 0)
        if not g: return ""
        return "≈" + "{:,}".format(round(g / so * 100)).replace(",", ".") + f" VND/100{dv}"

    def ngay_ngan(s):
        s = str(s).strip().split()[0] if str(s).strip() else ""
        m = _re.match(r"(\d{4})-(\d{1,2})-(\d{1,2})", s)      # Excel trả kiểu ngày ISO → về dd/mm
        if m: return f"{int(m.group(3)):02d}/{int(m.group(2)):02d}"
        m = _re.match(r"(\d{1,2})/(\d{1,2})(?:/\d{2,4})?$", s)
        if m: return f"{int(m.group(1)):02d}/{int(m.group(2)):02d}"
        return s

    def hieu_luc(item):
        tu, den = ngay_ngan(item.get("tu_ngay", "")), ngay_ngan(item.get("den_ngay", ""))
        if tu and den: return f"KM từ {tu} đến {den}"
        if den: return f"KM đến hết {den}"
        if tu: return f"KM từ {tu}"
        return ""

    def dam_hon(hex_mau, k=0.72):
        # màu đậm hơn để làm mép dưới dải có chiều sâu
        r, g, b = (int(hex_mau[i:i+2], 16) for i in (1, 3, 5))
        return "#{:02x}{:02x}{:02x}".format(int(r*k), int(g*k), int(b*k))

    def ve_tem(item):
        # vẽ 1 tem kích thước tw×th — mọi cỡ chữ tính theo kích thước tem nên khổ nào cũng cân
        nen = chu_de[2] if chu_de else "#ffffff"
        img = Image.new("RGB", (tw, th), nen)
        d = ImageDraw.Draw(img)
        vien = chu_de[1] if chu_de else T.LINE
        d.rounded_rectangle([2, 2, tw - 3, th - 3], radius=max(8, tw // 34), outline=vien, width=max(2, tw // 260))
        if chu_de and chu_de[3]:                      # hoạ tiết mùa rải chìm sau lưng nội dung
            for rx, ry, rs in ((0.05, 0.38, 0.30), (0.82, 0.22, 0.18), (0.44, 0.60, 0.22)):
                f_ht = T.font_u(int(th * rs))
                d.text((int(tw * rx), int(th * ry)), chu_de[3], font=f_ht, fill=chu_de[4])
        pad = max(10, tw // 26)
        inner_w = tw - 2 * pad
        y = max(6, th // 24)
        # badge tự do (HOT/NEW/TOP GIÁ SỐC...) đè chữ dải của theme; theme không dải thì dùng màu magenta
        nhan_dai = badge or (chu_de[0] if chu_de else None)
        if nhan_dai:                                  # dải chủ đề TO ĐẬM thay chỗ logo/SAKUKO
            mau_dai = chu_de[1] if chu_de else T.MAGENTA
            bh = max(28, int(th * 0.17))
            d.rectangle([3, 3, tw - 4, 3 + bh], fill=mau_dai)
            d.rectangle([3, 3 + bh - max(3, bh // 10), tw - 4, 3 + bh], fill=dam_hon(mau_dai))  # mép dưới đậm tạo khối
            fs = int(bh * 0.60)
            f = T.font_u(fs)
            while d.textlength(nhan_dai, font=f) > inner_w * 0.94 and fs > 12:
                fs -= 2; f = T.font_u(fs)
            net = max(1, f.size // 18)                # viền chữ cùng màu trắng → nét dày, nổi bật
            d.text(((tw - d.textlength(nhan_dai, font=f)) / 2, 3 + (bh - f.size) / 2 - net - 1), nhan_dai,
                   font=f, fill="#FFFFFF", stroke_width=net, stroke_fill="#FFFFFF")
            y = 3 + bh + max(6, th // 30)
        elif logo:
            img.paste(logo, ((tw - logo.width) // 2, y), logo)
            y += logo.height + max(6, th // 30)
        else:
            f = T.font(max(14, int(th * 0.075)))
            d.text(((tw - d.textlength("SAKUKO", font=f)) / 2, y), "SAKUKO", font=f, fill=mau_sk)
            y += f.size + max(6, th // 30)

        # badge % giảm giá — vòng tròn nổi góc phải trên tem khuyến mại
        gia_s, km_s = item.get("gia", ""), item.get("gia_km", "")
        r_badge = 0
        if theme == "promotion" and gia_s and km_s:
            g0 = int(_re.sub(r"\D", "", str(gia_s)) or 0)
            g1 = int(_re.sub(r"\D", "", str(km_s)) or 0)
            if 0 < g1 < g0:
                nhan_b = f"-{round((1 - g1 / g0) * 100)}%"
                r_badge = max(18, int(th * 0.135))
                cx, cy = tw - pad - r_badge, y + r_badge
                d.ellipse([cx - r_badge, cy - r_badge, cx + r_badge, cy + r_badge],
                          fill=chu_de[1] if chu_de else T.MAGENTA)
                f_b = T.fit(d, nhan_b, int(r_badge * 0.85), int(r_badge * 1.6), 11)
                d.text((cx - d.textlength(nhan_b, font=f_b) / 2, cy - f_b.size / 2 - 2), nhan_b,
                       font=f_b, fill="#FFFFFF", stroke_width=max(1, f_b.size // 20), stroke_fill="#FFFFFF")

        ten = item.get("ten", "")
        max_ten = inner_w - (4 * r_badge if r_badge else 0)   # tên căn GIỮA nên phải chừa badge cả 2 phía
        f_ten = T.font(max(16, int(th * 0.115)))
        lines = T.wrap(d, ten, f_ten, max_ten, max_lines=2)
        if len(lines) > 1 and max(d.textlength(l, font=f_ten) for l in lines) > max_ten:
            f_ten = T.fit(d, max(lines, key=len), f_ten.size, max_ten)
        for ln in lines:
            d.text(((tw - d.textlength(ln, font=f_ten)) / 2, y), ln, font=f_ten, fill=mau_ten)
            y += int(f_ten.size * 1.18)
        ten_jp = str(item.get("ten_jp", "")).strip()
        if ten_jp:                                    # tên gốc tiếng Nhật — khách ruột hàng Nhật check đúng vị quen
            fs = max(11, int(th * 0.075))
            f_jp = T.font_u(fs)
            while d.textlength(ten_jp, font=f_jp) > max_ten and fs > 10:
                fs -= 2; f_jp = T.font_u(fs)
            while d.textlength(ten_jp, font=f_jp) > max_ten and len(ten_jp) > 2:
                ten_jp = ten_jp.rstrip("…")[:-1] + "…"   # chữ Nhật không có dấu cách — cắt ký tự
            d.text(((tw - d.textlength(ten_jp, font=f_jp)) / 2, y), ten_jp, font=f_jp, fill=mau_phu)
            y += int(f_jp.size * 1.25)
        if in_hsd:                                    # dòng NSX/HSD nhỏ ngay dưới tên
            vb = dong_hsd(item)
            f_hd = T.fit(d, vb, max(12, int(th * 0.066)), inner_w, 11)
            d.text(((tw - d.textlength(vb, font=f_hd)) / 2, y + 2), vb, font=f_hd, fill=mau_phu)
            y += f_hd.size + 6

        # nhân viên CVS góp ý 13/07: mã vạch NHỎ lại, giá TO ra GIỮA, thêm Item No + mã hủy "H n" bên trái
        bc = T.lam_barcode(item["barcode"], int(tw * 0.40), int(th * 0.24), item.get("loai_ma", "auto")) if item.get("barcode") else None
        qr = T.lam_qr(item["qr"], int(th * 0.26)) if item.get("qr") else None
        item_no = str(item.get("ma_noibo", "")).strip()
        huy = _re.sub(r"\D", "", str(item.get("huy_truoc", "")))
        goc_phai = [p for p in (bc, qr) if p is not None]     # mã vạch + QR xếp cạnh nhau góc phải dưới
        du_phai = (sum(p.width for p in goc_phai) + (len(goc_phai) - 1) * (pad // 2)) if goc_phai else 0
        def dan_goc_phai():
            x = tw - pad
            for p in (qr, bc):                                 # QR ngoài cùng, mã vạch bên trái QR
                if p is None: continue
                img.paste(p, (x - p.width, th - pad - p.height))
                x -= p.width + pad // 2
        gia, gia_km, ctkm = item.get("gia", ""), item.get("gia_km", ""), item.get("ctkm", "")

        if theme == "promotion" and gia_km:
            # giá KM to + giá gạch + CTKM + hiệu lực + Item No — khổ thấp thì tự BỎ dần dòng ít quan trọng, không đè chữ
            hl = hieu_luc(item)
            co_it = bool(item_no or huy)
            vung_w = inner_w - (du_phai + pad if du_phai else 0)
            f_km = T.fit(d, T.gia_dep(gia_km), max(20, int(th * 0.19)), vung_w, 20)
            km_y = th - pad - f_km.size - (int(th * 0.09) if ctkm else 0) - (int(th * 0.085) if gia else 0) \
                   - (int(th * 0.072) if hl else 0) - (int(th * 0.065) if co_it else 0)
            km_y = max(y, km_y)
            day = th - pad + 2                          # mép dưới cho phép
            d.text((pad, km_y), T.gia_dep(gia_km), font=f_km, fill=mau_gia)
            yy = km_y + f_km.size + 2
            if gia:
                f_cu = T.font(max(12, int(th * 0.075)))
                if yy + f_cu.size <= day:
                    cu = T.gia_dep(gia)
                    d.text((pad, yy), cu, font=f_cu, fill=T.XAM)
                    lw = d.textlength(cu, font=f_cu)
                    d.line([pad, yy + f_cu.size // 2, pad + lw, yy + f_cu.size // 2], fill=T.XAM, width=max(2, th // 140))
                    yy += f_cu.size + 2
            if ctkm:
                f_ct = T.fit(d, ctkm, max(11, int(th * 0.07)), vung_w, 11)
                if yy + f_ct.size <= day:
                    d.text((pad, yy), ctkm, font=f_ct, fill=T.NAVY)
                    yy += f_ct.size + 2
            if hl:                                     # hiệu lực giá: bằng chứng khi quên bóc tem hết CTKM
                f_hl = T.fit(d, hl, max(10, int(th * 0.06)), vung_w, 10)
                if yy + f_hl.size <= day:
                    d.text((pad, yy), hl, font=f_hl, fill=mau_phu)
                    yy += f_hl.size + 2
            if co_it:                                  # dòng Item No + mã hủy nhỏ cuối cột trái
                f_it = T.font(max(10, int(th * 0.055)))
                if yy + f_it.size <= day:
                    vb2 = " · ".join(x for x in (("Item No " + item_no) if item_no else "", ("H " + huy) if huy else "") if x)
                    d.text((pad, yy), vb2, font=f_it, fill=mau_phu)
            dan_goc_phai()
        else:
            # ---- bố cục chuẩn CVS: giá TO căn GIỮA, mã vạch nhỏ góc phải, Item No + "H n" góc trái ----
            f_it = T.font(max(11, int(th * 0.062)))
            f_h = T.font(max(12, int(th * 0.075)))
            cao_trai = (f_it.size + 4 if item_no else 0) + (f_h.size + 12 if huy else 0)
            cao_phai = max((p.height for p in goc_phai), default=0)
            cao_day = max(cao_trai, cao_phai)
            if gia:
                gia_s2 = T.gia_dep(gia)
                f_gia = T.fit(d, gia_s2, max(24, int(th * 0.27)), int(inner_w * 0.94), 20)
                dv = don_gia(item)
                hl2 = hieu_luc(item)                   # từ–đến ngày cũng hiện ở bố cục thường (áp cả loạt)
                f_dv = T.font(max(10, int(th * 0.058)))
                f_hl2 = T.font(max(10, int(th * 0.055)))
                khoi_cao = f_gia.size + (f_dv.size + 4 if dv else 0) + (f_hl2.size + 3 if hl2 else 0)
                gy = max(y, y + (th - pad - cao_day - y - khoi_cao) / 2)
                d.text(((tw - d.textlength(gia_s2, font=f_gia)) / 2, gy), gia_s2, font=f_gia, fill=mau_gia)
                yy2 = gy + f_gia.size + 3
                if dv:
                    d.text(((tw - d.textlength(dv, font=f_dv)) / 2, yy2), dv, font=f_dv, fill=mau_phu)
                    yy2 += f_dv.size + 3
                if hl2:
                    d.text(((tw - d.textlength(hl2, font=f_hl2)) / 2, yy2), hl2, font=f_hl2, fill=mau_phu)
            dan_goc_phai()
            ty = th - pad - cao_trai + 2
            if item_no:
                d.text((pad, ty), "Item No: " + item_no, font=f_it, fill=mau_phu)
                ty += f_it.size + 4
            if huy:                                    # ô "H 2" = hủy trước HSD 2 ngày — nhân viên nào nhìn cũng hiểu
                hs = "H " + huy
                bw2 = d.textlength(hs, font=f_h) + 14
                d.rounded_rectangle([pad, ty, pad + bw2, ty + f_h.size + 8], radius=5, outline=mau_ten, width=max(2, th // 160))
                d.text((pad + 7, ty + 3), hs, font=f_h, fill=mau_ten)

        # ngày in nhỏ sát mép dưới — đi tuần kệ biết ngay tem cũ cần thay
        vb_in = "In " + _now.strftime("%d/%m")
        f_in = T.font(max(9, int(th * 0.048)))
        d.text(((tw - d.textlength(vb_in, font=f_in)) / 2, th - f_in.size - 5), vb_in, font=f_in, fill=mau_phu)
        return img

    os.makedirs(os.path.dirname(dest), exist_ok=True)
    tems = [ve_tem(it) for it in items]

    if xuat == "png":
        goc, duoi = os.path.splitext(dest)
        for i, t in enumerate(tems):
            t.save(f"{goc}-{i}.png")
        print(f"OKPNG {len(tems)}")                       # server tự ghép danh sách file
    elif kho == "a4":
        per = COLS * ROWS
        cho_trong = max(0, min(per - 1, batdau - 1))   # chừa các ô đã dùng trên tờ cắt dở
        slots = [None] * cho_trong + tems
        pages = []
        for start in range(0, len(slots), per):
            page = Image.new("RGB", (W_A4, H_A4), (255, 255, 255))
            for idx, t in enumerate(slots[start:start + per]):
                if t is None: continue
                r, c = divmod(idx, COLS)
                page.paste(t, (M + c * cw + PADC, M + r * ch + PADC))
            pages.append(page)
        pages[0].save(dest, save_all=True, append_images=pages[1:], resolution=T.DPI)
        tb = f"OK {len(tems)} tem, {len(pages)} trang A4"
        if cho_trong: tb += f" (bắt đầu từ ô {cho_trong + 1})"
        print(tb)
    else:
        tems[0].save(dest, save_all=True, append_images=tems[1:], resolution=T.DPI)
        print(f"OK {len(tems)} tem khổ {kho[0]}x{kho[1]}mm, mỗi tem 1 trang")
except ValueError as e:
    print("ERR: " + str(e)[:180]); sys.exit(6)
except Exception as e:
    print("ERR: " + str(e)[:180]); sys.exit(7)
