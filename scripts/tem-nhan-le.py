#!/usr/bin/env python3
# Tem nhãn sản phẩm (nhãn phụ): python3 tem-nhan-le.py <input.xlsx> <dest.pdf> [logo|-] [khổ] [ô bắt đầu] [xem thử 0/1]
#   khổ: 50x30 | 58x40 | 70x50 | 100x70 (mặc định) | "RỘNGxCAO" mm | a4 (lưới 2×4 nhãn 100×70)
# Excel theo mẫu mau-tem-nhan.xlsx. Tên đậm nổi bật; tiêu đề Thành phần/Công dụng/HDSD... in đậm;
# nội dung tự xuống dòng; trường trống TỰ ẨN; chữ tự thu nhỏ cho vừa khổ. Mỗi sản phẩm 1 tem (nhân theo Số lượng).
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from PIL import Image, ImageDraw
    import tem_lib as T
    if len(sys.argv) < 3: print("ERR: thiếu tham số"); sys.exit(2)
    srcp, dest = sys.argv[1], sys.argv[2]
    logop = sys.argv[3] if len(sys.argv) > 3 else "-"
    kho = T.doc_kho(sys.argv[4] if len(sys.argv) > 4 else "100x70", )
    if kho == "a4": kho_a4, kho = True, (100, 70)
    else: kho_a4 = False
    if not os.path.exists(srcp): print("ERR: không thấy dữ liệu"); sys.exit(3)
    if not T.FONTP: print("ERR: máy không có font Arial"); sys.exit(5)

    batdau = int(sys.argv[5]) if len(sys.argv) > 5 and str(sys.argv[5]).isdigit() else 1
    xemthu = len(sys.argv) > 6 and sys.argv[6] == "1"

    items = T.nhan_sl(T.doc_bang(srcp), 120)
    if not items: print("ERR: chưa có dòng sản phẩm nào (xem file Excel mẫu)"); sys.exit(4)
    if xemthu: items = items[:1]

    tw, th = T.mm2px(kho[0]), T.mm2px(kho[1])
    logo = T.tai_logo(logop, int(tw * 0.5), max(24, int(th * 0.12)))

    TRUONG = [("thanh_phan", "Thành phần"), ("cong_dung", "Công dụng"), ("hdsd", "Hướng dẫn sử dụng"),
              ("khoi_luong", "Khối lượng"), ("xuat_xu", "Xuất xứ"), ("nsx", "Nhà sản xuất"), ("khac", "Thông tin khác")]

    def ve_nhan(item):
        img = Image.new("RGB", (tw, th), (255, 255, 255))
        d = ImageDraw.Draw(img)
        d.rectangle([2, 2, tw - 3, th - 3], outline=T.NAVY, width=max(2, tw // 300))
        pad = max(12, tw // 30)
        inner_w = tw - 2 * pad

        # chữ tự thu nhỏ dần đến khi toàn bộ nội dung vừa khổ tem
        for ti_le in (1.0, 0.9, 0.8, 0.7, 0.6, 0.5):
            base = max(11, int(th * 0.052 * ti_le))
            f_ten = T.font(int(base * 1.5))
            f_nd = T.font(base)
            khoi = []                                   # [(dòng chữ, font, màu, cách trên)]
            y_uoc = pad
            if logo: y_uoc += logo.height + int(base * 0.5)
            for ln in T.wrap(d, item.get("ten", ""), f_ten, inner_w):
                khoi.append((ln, f_ten, T.NAVY, 0)); y_uoc += int(f_ten.size * 1.2)
            y_uoc += int(base * 0.35)
            for key, nhan in TRUONG:
                if not item.get(key): continue          # trường trống tự ẩn
                vb = f"{nhan}: {item[key]}"
                for j, ln in enumerate(T.wrap(d, vb, f_nd, inner_w)):
                    khoi.append((ln, f_nd, "dam_dau" if j == 0 else "thuong", int(base * 0.3) if j == 0 else 0))
                    y_uoc += int(f_nd.size * 1.28) + (int(base * 0.3) if j == 0 else 0)
            if y_uoc <= th - pad: break
        if y_uoc > th - pad:
            return None                                 # vẫn tràn ở cỡ nhỏ nhất

        y = pad
        if logo:
            img.paste(logo, ((tw - logo.width) // 2, y), logo)
            y += logo.height + int(base * 0.5)
        dem_ten = True
        for ln, f, mau, cach in khoi:
            y += cach
            if mau == T.NAVY:                            # dòng tên: căn giữa, navy đậm
                d.text(((tw - d.textlength(ln, font=f)) / 2, y), ln, font=f, fill=T.NAVY)
                y += int(f.size * 1.2)
                continue
            if mau == "dam_dau":                         # dòng đầu của trường: "Tiêu đề:" đậm navy, phần sau đen
                nhan, _, con_lai = ln.partition(":")
                d.text((pad, y), nhan + ":", font=f, fill=T.NAVY)
                d.text((pad + d.textlength(nhan + ": ", font=f), y), con_lai.strip(), font=f, fill="#222222")
            else:
                d.text((pad, y), ln, font=f, fill="#222222")
            y += int(f.size * 1.28)
        return img

    os.makedirs(os.path.dirname(dest), exist_ok=True)
    nhans, loi = [], []
    for it in items:
        n = ve_nhan(it)
        if n is None: loi.append(it.get("ten", "?")[:40])
        else: nhans.append(n)
    if not nhans:
        print("ERR: nội dung quá dài so với khổ tem — chọn khổ to hơn (vd 100x70)"); sys.exit(6)

    if xemthu:                                          # xem thử: chỉ 1 nhãn ra PNG
        nhans[0].save(dest)
        print("OK xem thử 1 nhãn"); sys.exit(0)
    if kho_a4:                                          # lưới A4: 2 cột × 4 hàng nhãn 100×70
        W_A4, H_A4, M, G = 2480, 3508, 90, 40
        per = 8
        cho_trong = max(0, min(per - 1, batdau - 1))    # chừa các ô đã dùng trên tờ cắt dở
        slots = [None] * cho_trong + nhans
        pages = []
        for start in range(0, len(slots), per):
            page = Image.new("RGB", (W_A4, H_A4), (255, 255, 255))
            for idx, n in enumerate(slots[start:start + per]):
                if n is None: continue
                r, c = divmod(idx, 2)
                page.paste(n, (M + c * (tw + G), M + r * (th + G)))
            pages.append(page)
        pages[0].save(dest, save_all=True, append_images=pages[1:], resolution=T.DPI)
        thongbao = f"OK {len(nhans)} nhãn, {len(pages)} trang A4" + (f" (bắt đầu từ ô {cho_trong + 1})" if cho_trong else "")
    else:
        nhans[0].save(dest, save_all=True, append_images=nhans[1:], resolution=T.DPI)
        thongbao = f"OK {len(nhans)} nhãn khổ {kho[0]}x{kho[1]}mm, mỗi nhãn 1 trang"
    if loi: thongbao += f" (BỎ QUA {len(loi)} nhãn quá dài: {', '.join(loi[:3])}...)"
    print(thongbao)
except ValueError as e:
    print("ERR: " + str(e)[:180]); sys.exit(6)
except Exception as e:
    print("ERR: " + str(e)[:180]); sys.exit(7)
