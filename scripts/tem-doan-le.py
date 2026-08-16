#!/usr/bin/env python3
# Tem đồ ăn tươi (quầy CVS): python3 tem-doan-le.py <input.xlsx|.txt> <dest.pdf> [logo|-] [khổ] [ô bắt đầu] [xem thử 0/1] [prefix]
# Mã vạch NHÚNG GIÁ chuẩn POS: EAN-13 = <prefix 2 số, mặc định 20> + <mã món 5 số> + <thành tiền 5 số VND> + checksum.
# Cân (kg) có giá trị → thành tiền = giá/kg × cân (làm tròn trăm đồng); không có → thành tiền = giá suất.
# Cột "Hạn dùng (ngày)" → tự in NSX (lúc in) + HSD (= lúc in + N ngày). Trường trống tự ẩn.
# Text dán tay: mỗi dòng "Tên | Giá | Mã món | Cân kg | Hạn dùng ngày | Số lượng" (từ cột 3 trở đi không bắt buộc).
import sys, os, re
from datetime import datetime, timedelta
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from PIL import Image, ImageDraw
    import tem_lib as T
    if len(sys.argv) < 3: print("ERR: thiếu tham số"); sys.exit(2)
    srcp, dest = sys.argv[1], sys.argv[2]
    logop = sys.argv[3] if len(sys.argv) > 3 else "-"
    kho = T.doc_kho(sys.argv[4] if len(sys.argv) > 4 else "50x30", )
    batdau = int(sys.argv[5]) if len(sys.argv) > 5 and str(sys.argv[5]).isdigit() else 1
    xemthu = len(sys.argv) > 6 and sys.argv[6] == "1"
    prefix = sys.argv[7] if len(sys.argv) > 7 and re.fullmatch(r"2\d", sys.argv[7] or "") else "20"
    if not os.path.exists(srcp): print("ERR: không thấy dữ liệu"); sys.exit(3)
    if not T.FONTP: print("ERR: máy không có font Arial"); sys.exit(5)

    items = T.doc_excel(srcp) if srcp.lower().endswith((".xlsx", ".xlsm")) else T.doc_text_doan(srcp)
    items = T.nhan_sl(items, 240)
    if not items: print("ERR: chưa có dòng món nào (xem file Excel mẫu — dòng Cơm nắm/Gà chiên)"); sys.exit(4)
    if xemthu: items = items[:1]

    now = datetime.now()
    dem_ma = [10000]                        # tự đánh mã món 5 số nếu Excel không ghi
    def tinh(item):
        # trả (thành tiền, mô tả cân, mã vạch 12 số hoặc None, lỗi)
        gia_raw = re.sub(r"[^\d]", "", str(item.get("gia", ""))) or "0"
        gia = int(gia_raw)
        can = str(item.get("can_kg", "")).replace(",", ".").strip()
        mo_ta = ""
        if can:
            try:
                kg = float(can)
                tien = int(round(gia * kg / 100.0)) * 100      # làm tròn trăm đồng
                mo_ta = f"{kg:g} kg × {T.gia_dep(gia)}/kg"
            except ValueError:
                return None, "", None, f"cân '{can}' không phải số"
        else:
            tien = gia
        if tien <= 0: return tien, mo_ta, None, None            # không giá → tem không mã
        if tien > 99999: return tien, mo_ta, None, "thành tiền vượt 99.999đ — không nhúng được vào mã"
        ma = re.sub(r"\D", "", str(item.get("ma_mon", "")))[:5]
        if not ma:
            dem_ma[0] += 1; ma = str(dem_ma[0])
        ma12 = prefix + ma.zfill(5) + str(tien).zfill(5)
        return tien, mo_ta, ma12, None

    def dong_hsd(item):
        hd = str(item.get("han_dung", "")).strip()
        if re.fullmatch(r"\d{1,3}", hd):
            return f"NSX {now.strftime('%d/%m %H:%M')} · HSD {(now + timedelta(days=int(hd))).strftime('%d/%m/%Y')}"
        if hd: return f"NSX {now.strftime('%d/%m/%Y')} · HSD {hd}"
        return ""

    if kho == "a4":
        W_A4, H_A4, M = 2480, 3508, 70
        COLS, ROWS = 3, 8
        cw, ch = (W_A4 - 2 * M) // COLS, (H_A4 - 2 * M) // ROWS
        PADC = 18
        tw, th = cw - 2 * PADC, ch - 2 * PADC
    else:
        tw, th = T.mm2px(kho[0]), T.mm2px(kho[1])
    logo = T.tai_logo(logop, int(tw * 0.55), max(24, int(th * 0.15)))

    loi = []
    def ve_tem(item):
        tien, mo_ta, ma12, err = tinh(item)
        if err and tien is None:
            loi.append(f"{item.get('ten','?')[:30]} ({err})"); return None
        img = Image.new("RGB", (tw, th), (255, 255, 255))
        d = ImageDraw.Draw(img)
        d.rounded_rectangle([2, 2, tw - 3, th - 3], radius=max(8, tw // 34), outline=T.LINE, width=max(2, tw // 260))
        pad = max(10, tw // 26)
        inner_w = tw - 2 * pad
        y = max(6, th // 26)
        if logo:
            img.paste(logo, ((tw - logo.width) // 2, y), logo); y += logo.height + max(4, th // 40)
        else:
            f = T.font(max(12, int(th * 0.06)))
            d.text(((tw - d.textlength("SAKUKO", font=f)) / 2, y), "SAKUKO", font=f, fill=T.MAGENTA)
            y += f.size + max(4, th // 40)
        f_ten = T.font(max(15, int(th * 0.105)))
        for ln in T.wrap(d, item.get("ten", ""), f_ten, inner_w, max_lines=2):
            d.text(((tw - d.textlength(ln, font=f_ten)) / 2, y), ln, font=f_ten, fill=T.NAVY)
            y += int(f_ten.size * 1.16)
        if mo_ta:                                     # dòng "0.5 kg × 89.000 ₫/kg"
            f_mt = T.fit(d, mo_ta, max(11, int(th * 0.062)), inner_w, 11)
            d.text(((tw - d.textlength(mo_ta, font=f_mt)) / 2, y), mo_ta, font=f_mt, fill="#44506b")
            y += f_mt.size + 4
        hsd = dong_hsd(item)
        if hsd:
            f_hd = T.fit(d, hsd, max(11, int(th * 0.062)), inner_w, 11)
            d.text(((tw - d.textlength(hsd, font=f_hd)) / 2, y), hsd, font=f_hd, fill="#44506b")
            y += f_hd.size + 4
        bc = T.lam_barcode(ma12, int(tw * 0.52), int(th * 0.30)) if ma12 else None
        gia_hien = T.gia_dep(tien) if tien else ""
        if bc is not None:
            if gia_hien:
                f_gia = T.fit(d, gia_hien, max(16, int(th * 0.15)), inner_w - bc.width - pad, 16)
                d.text((pad, th - pad - bc.height // 2 - f_gia.size // 2), gia_hien, font=f_gia, fill=T.MAGENTA)
            img.paste(bc, (tw - pad - bc.width, th - pad - bc.height))
            if err: loi.append(f"{item.get('ten','?')[:30]} ({err})")
        elif gia_hien:
            f_gia = T.fit(d, gia_hien, max(18, int(th * 0.17)), inner_w, 18)
            d.text(((tw - d.textlength(gia_hien, font=f_gia)) / 2, th - pad - f_gia.size), gia_hien, font=f_gia, fill=T.MAGENTA)
            if err: loi.append(f"{item.get('ten','?')[:30]} ({err})")
        return img

    tems = [t for t in (ve_tem(it) for it in items) if t is not None]
    if not tems: print("ERR: " + (loi[0] if loi else "không tạo được tem nào")); sys.exit(6)

    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if xemthu:
        tems[0].save(dest); print("OK xem thử 1 tem"); sys.exit(0)
    if kho == "a4":
        per = COLS * ROWS
        cho_trong = max(0, min(per - 1, batdau - 1))
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
        tb = f"OK {len(tems)} tem, {len(pages)} trang A4" + (f" (bắt đầu từ ô {cho_trong + 1})" if cho_trong else "")
    else:
        tems[0].save(dest, save_all=True, append_images=tems[1:], resolution=T.DPI)
        tb = f"OK {len(tems)} tem khổ {kho[0]}x{kho[1]}mm, mỗi tem 1 trang"
    if loi: tb += f" (CHÚ Ý {len(loi)}: {'; '.join(loi[:3])})"
    print(tb)
except ValueError as e:
    print("ERR: " + str(e)[:180]); sys.exit(6)
except Exception as e:
    print("ERR: " + str(e)[:180]); sys.exit(7)
