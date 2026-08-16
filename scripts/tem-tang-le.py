#!/usr/bin/env python3
# Tem khuyến mại dán hàng (hàng tặng hàng): python3 tem-tang-le.py <dest> <text> <hình> <màu> <khổ> <SL> <xuất> [ô bắt đầu]
#   text: các dòng cách nhau "|" — vd "MUA 1|TẶNG 1", "KHUYẾN MẠI|ĐẶC BIỆT"
#   hình: sao (ngôi sao gai) | tron | bong (bóng thoại)    màu: do (nền đỏ chữ trắng) | vang (nền vàng chữ đỏ) | trang (nền trắng viền đỏ)
#   khổ: "50x50" mm    SL: số tem in    xuất: pdf (xếp lưới A4, cắt dán) | png (1 tem nền trong suốt)
# Tham khảo mẫu tem in ấn phổ thông Sếp gửi 13/07/2026 — combo đỏ/vàng là ngoại lệ brand cho tem điểm bán.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from PIL import Image, ImageDraw
    import tem_lib as T
    if len(sys.argv) < 3: print("ERR: thiếu tham số"); sys.exit(2)
    dest = sys.argv[1]
    text = sys.argv[2].strip()
    hinh = (sys.argv[3] if len(sys.argv) > 3 else "sao").lower()
    mau = (sys.argv[4] if len(sys.argv) > 4 else "vang").lower()
    kho = T.doc_kho(sys.argv[5] if len(sys.argv) > 5 else "50x50", "50x50")
    if kho == "a4": kho = (50, 50)
    sl = max(1, min(240, int(sys.argv[6]) if len(sys.argv) > 6 and sys.argv[6].isdigit() else 24))
    xuat = (sys.argv[7] if len(sys.argv) > 7 else "pdf").lower()
    batdau = int(sys.argv[8]) if len(sys.argv) > 8 and str(sys.argv[8]).isdigit() else 1
    if not text: print("ERR: chưa có nội dung tem"); sys.exit(3)
    if not T.FONTP: print("ERR: máy không có font Arial"); sys.exit(5)

    DO, VANG, TRANG = "#d81f26", "#ffd200", "#ffffff"
    BANG_MAU = {                       # (nền, viền, chữ, viền chữ)
        "do":    (DO, "#a5121a", TRANG, None),
        "vang":  (VANG, DO, DO, TRANG),
        "trang": (TRANG, DO, DO, None),
    }
    nen, vien, chu, vien_chu = BANG_MAU.get(mau, BANG_MAU["vang"])

    SS = 2                             # vẽ nét mượt: dựng 2x rồi thu về
    tw, th = T.mm2px(kho[0]), T.mm2px(kho[1])
    W, H = tw * SS, th * SS
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    bv = max(3, int(min(W, H) * 0.045))            # bề dày viền

    vung = [0, 0, W, H]                            # vùng đặt chữ (tuỳ hình)
    if hinh == "sao":
        cx, cy = W / 2, H / 2
        r_ngoai = min(W, H) / 2 - 3 * SS
        r_trong = r_ngoai * 0.82
        pts = []
        for i in range(24):
            r = r_ngoai if i % 2 == 0 else r_trong
            a = math.pi * i / 12 - math.pi / 2
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        d.polygon(pts, fill=nen, outline=vien if mau != "do" else None, width=bv if mau != "do" else 0)
        r_chu = r_trong * 0.92
        vung = [cx - r_chu * 0.78, cy - r_chu * 0.62, cx + r_chu * 0.78, cy + r_chu * 0.62]
    elif hinh == "nhat":                           # chữ nhật bo góc — CÀI NẸP KỆ chắc chắn, không cong vênh (góp ý CVS 13/07)
        rad = int(min(W, H) * 0.14)
        d.rounded_rectangle([2, 2, W - 3, H - 3], radius=rad, fill=nen, outline=vien, width=bv)
        vung = [W * 0.07, H * 0.12, W * 0.93, H * 0.88]
    elif hinh == "bong":                           # bóng thoại như mẫu "KHUYẾN MÃI ĐẶC BIỆT"
        bh = int(H * 0.80)
        rad = int(min(W, bh) * 0.20)
        d.rounded_rectangle([2, 2, W - 3, bh], radius=rad, fill=nen, outline=vien, width=bv)
        d.polygon([(W * 0.26, bh - bv), (W * 0.50, bh - bv), (W * 0.30, H - 2)], fill=vien)
        d.polygon([(W * 0.305, bh - bv - 1), (W * 0.445, bh - bv - 1), (W * 0.318, H - bv * 1.8)], fill=nen)
        vung = [W * 0.10, bh * 0.12, W * 0.90, bh * 0.88]
    else:                                          # tròn
        d.ellipse([2, 2, W - 3, H - 3], fill=nen, outline=vien, width=bv)
        cx, cy, r = W / 2, H / 2, min(W, H) / 2
        vung = [cx - r * 0.72, cy - r * 0.58, cx + r * 0.72, cy + r * 0.58]

    # chữ: các dòng chia đều vùng, tự thu cỡ cho vừa, viền chữ (nếu có) kiểu tem chợ
    dongs = [l.strip() for l in text.split("|") if l.strip()][:3]
    vw, vh = vung[2] - vung[0], vung[3] - vung[1]
    cao_dong = vh / len(dongs)
    fs0 = int(cao_dong * 0.78)
    fonts = []
    for ln in dongs:
        fs = fs0
        f = T.font(fs)
        while d.textlength(ln, font=f) > vw and fs > 10:
            fs -= 2; f = T.font(fs)
        fonts.append(f)
    fs_chung = min(f.size for f in fonts)          # các dòng cùng cỡ cho cân
    f = T.font(fs_chung)
    tong_cao = len(dongs) * fs_chung * 1.16
    y = vung[1] + (vh - tong_cao) / 2
    for ln in dongs:
        x = vung[0] + (vw - d.textlength(ln, font=f)) / 2
        net = max(2, fs_chung // 10) if vien_chu else 0
        d.text((x, y), ln, font=f, fill=chu, stroke_width=net, stroke_fill=vien_chu)
        y += fs_chung * 1.16

    tem = img.resize((tw, th), Image.LANCZOS)
    os.makedirs(os.path.dirname(dest), exist_ok=True)

    if xuat == "png":                              # 1 tem nền trong suốt (gửi Zalo / chèn thiết kế)
        goc, _ = os.path.splitext(dest)
        tem.save(goc + "-0.png")
        print("OKPNG 1"); sys.exit(0)

    W_A4, H_A4, M, G = 2480, 3508, 70, 26          # xếp lưới A4
    cols = max(1, (W_A4 - 2 * M + G) // (tw + G))
    rows = max(1, (H_A4 - 2 * M + G) // (th + G))
    per = cols * rows
    cho_trong = max(0, min(per - 1, batdau - 1))
    slots = [None] * cho_trong + [tem] * sl
    pages = []
    for start in range(0, len(slots), per):
        page = Image.new("RGB", (W_A4, H_A4), (255, 255, 255))
        for idx, t_ in enumerate(slots[start:start + per]):
            if t_ is None: continue
            r, c = divmod(idx, cols)
            page.paste(t_, (M + c * (tw + G), M + r * (th + G)), t_)
        pages.append(page)
    pages[0].save(dest, save_all=True, append_images=pages[1:], resolution=T.DPI)
    tb = f"OK {sl} tem {kho[0]}x{kho[1]}mm, {len(pages)} trang A4 ({per} tem/trang)"
    if cho_trong: tb += f", bắt đầu từ ô {cho_trong + 1}"
    print(tb)
except ValueError as e:
    print("ERR: " + str(e)[:180]); sys.exit(6)
except Exception as e:
    print("ERR: " + str(e)[:180]); sys.exit(7)
