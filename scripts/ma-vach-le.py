#!/usr/bin/env python3
# Mã vạch hàng loạt (chức năng 1): python3 ma-vach-le.py <input.xlsx|.txt> <dest.pdf> [logo|-]
# Import Excel (Barcode, Tên sản phẩm, Giá niêm yết, Loại mã) → PDF danh mục: mỗi hàng = hình mã + Barcode + Tên + Giá.
# Cột "Loại mã": bỏ trống = tự chọn (12-13 số → EAN-13, khác → Code128) | EAN-13 | Code128 | ITF-14 (thùng carton,
# 13-14 số) | GS1-128 (chuỗi AI nhúng HSD/số lô, vd (01)GTIN(17)YYMMDD(10)Lô) | QR (cột Barcode chứa link/nội dung).
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from PIL import Image, ImageDraw
    import tem_lib as T
    if len(sys.argv) < 3: print("ERR: thiếu tham số"); sys.exit(2)
    srcp, dest = sys.argv[1], sys.argv[2]
    logop = sys.argv[3] if len(sys.argv) > 3 else "-"
    if not os.path.exists(srcp): print("ERR: không thấy dữ liệu"); sys.exit(3)
    if not T.FONTP: print("ERR: máy không có font Arial"); sys.exit(5)

    items = [d for d in T.doc_bang(srcp) if d.get("barcode")]
    if not items: print("ERR: chưa có dòng nào có Barcode (xem file Excel mẫu)"); sys.exit(4)
    if len(items) > 300: print(f"ERR: {len(items)} mã — tối đa 300 mã/lần"); sys.exit(6)

    W, H, M = 2480, 3508, 100                     # A4 300dpi
    HEAD, ROW = 240, 470                          # 7 hàng/trang
    PER = (H - M - HEAD) // ROW
    logo = T.tai_logo(logop, 600, 110)

    pages, so_loi = [], 0
    for start in range(0, len(items), PER):
        page = Image.new("RGB", (W, H), (255, 255, 255))
        d = ImageDraw.Draw(page)
        d.rectangle([0, 0, W, HEAD - 60], fill=T.NAVY)
        f_t = T.font(64)
        d.text((M, (HEAD - 60 - 64) / 2), "DANH MỤC MÃ VẠCH SẢN PHẨM", font=f_t, fill="#FFFFFF")
        if logo: page.paste(logo, (W - M - logo.width, (HEAD - 60 - logo.height) // 2), logo)
        y = HEAD
        for item in items[start:start + PER]:
            loai = T.chuan_loai(item.get("loai_ma"))
            NHAN_LOAI = {"ean13": "EAN-13", "code128": "Code128", "itf14": "ITF-14 (thùng)", "gs1": "GS1-128", "qr": "QR"}
            bc = T.lam_qr(item["barcode"], 300) if loai == "qr" else T.lam_barcode(item["barcode"], 700, 300, loai)
            if bc is None:
                so_loi += 1
                d.text((M, y + 40), f"(mã lỗi: {item['barcode'][:24]})", font=T.font(40), fill=T.XAM)
            else:
                page.paste(bc, (M, y + (ROW - bc.height) // 2))
            x = M + 760
            yy = y + 60
            f_ma = T.font(52)
            ma_hien = item["barcode"] if len(item["barcode"]) <= 28 else item["barcode"][:27] + "…"
            d.text((x, yy), ma_hien, font=f_ma, fill=T.NAVY)
            if loai != "auto":
                d.text((x + d.textlength(ma_hien, font=f_ma) + 30, yy + 8), NHAN_LOAI.get(loai, ""), font=T.font(38), fill=T.XAM)
            yy += 76
            if item.get("ten"):
                f_ten = T.font(56)
                for ln in T.wrap(d, item["ten"], f_ten, W - x - M, max_lines=2):
                    d.text((x, yy), ln, font=f_ten, fill="#222222"); yy += 68
            if item.get("gia"):
                d.text((x, yy), T.gia_dep(item["gia"]), font=T.font(56), fill=T.MAGENTA)
            d.line([M, y + ROW, W - M, y + ROW], fill=T.LINE, width=2)
            y += ROW
        pages.append(page)

    os.makedirs(os.path.dirname(dest), exist_ok=True)
    pages[0].save(dest, save_all=True, append_images=pages[1:], resolution=T.DPI)
    tb = f"OK {len(items) - so_loi} mã, {len(pages)} trang"
    if so_loi: tb += f" ({so_loi} mã lỗi bỏ qua)"
    print(tb)
except Exception as e:
    print("ERR: " + str(e)[:180]); sys.exit(7)
