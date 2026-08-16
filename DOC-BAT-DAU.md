# Xưởng tem nhãn Sakuko — web riêng (Go) · Đọc cái này trước

> Claude: mở dự án này thì đọc file này trước khi làm. Đây là bản TÁCH module tem nhãn khỏi
> `sakuko-xuong-phan-mem` thành web app riêng theo **phương án A: Go làm vỏ + Python vẽ tem**.
> Sếp đã chốt ngày 13/07/2026. Mục tiêu: chạy trên server riêng 24/7 cho 10 cửa hàng CVS, thoát máy bàn.

## Kiến trúc (đã chốt — đừng đảo)
- **Go (main.go, thuần stdlib)** = vỏ web: static + 5 API `/api/tem-gia · tem-doan · tem-nhan · ma-vach · tem-tang`.
- **Python (scripts/)** = engine vẽ tem ĐÃ NGHIỆM THU từng pixel (tem_lib + 5 script; 19 theme, EAN-13 nhúng giá POS, tiếng Việt + kana). **KHÔNG viết lại bằng Go** — giữ nguyên, chỉ gọi qua `exec`.
- Hợp đồng API **GIỮ NGUYÊN Y HỆT** module tem trong `sakuko-xuong-phan-mem/app/server.js` (multipart `text|file`, `logo`, tham số; trả `{ok,url,info}` hoặc `{ok,items:[{url}]}`) — để bê giao diện cũ + Bé Tem sang không phải sửa.
- File sinh ra: `public/out/` (gitignore). Cổng **4200**.
- **Valkey: giai đoạn 2** (cache tồn kho Lark + hàng đợi in). Chưa cần bây giờ — đừng thêm sớm.

## Chạy trên laptop
```bash
brew install go                                # nếu chưa có
pip3 install python-barcode openpyxl pillow    # engine tem cần
go run .                                       # → http://localhost:4200
```
Đã test đầu-cuối trên máy bàn 13/07: tem giá PDF + PNG xem thử + tem khuyến mại đều ra thật.
Cần font **Arial** (macOS có sẵn; sau này deploy Linux phải bundle font — ghi ở việc số 5).

## VIỆC TIẾP THEO (làm theo thứ tự)
0. ✅ **XONG 15/07 (máy bàn)** — Đuổi kịp tool tem giá cũ + đồng bộ engine góp ý đợt 1 từ sakuko-xuong-phan-mem:
   - (a) ✅ Khổ to 60x45 · 90x60 · 60x90 · 140x100 · 210x100 + **a4-2/a4-4/a4-6/a4-9** (A4 chia 2/4/6/9 tem lớn — lưới tem-gia-le.py nhận cột×hàng động) + 58x30 nẹp kệ CVS.
   - (b) ✅ "KM từ ngày – đến ngày" áp cả loạt (argv 10-11, form `tu`/`den`; dòng có sẵn Từ/Đến riêng thì ưu tiên của dòng; hiện cả ở bố cục thường).
   - (c) ✅ "Chữ thêm lên tem" tự do (argv 12, form `badge`, ≤30 ký tự) — đè chữ dải theme, theme không dải thì dải magenta.
   - (d) ✅ Nút ⬇ tải Excel mẫu (public/mau-tem-nhan.xlsx).
   - (e) ✅ Trần 500 tem/lần.
   - Đồng bộ đợt 1: VND, Item No (ma_noibo), mã hủy H-n, giá to căn giữa, barcode nhỏ, tem KM hình "nhat" chữ nhật + khổ 58x37 cài nẹp kệ.
   - Gọi kiểu cũ (7-9 tham số) vẫn chạy — hợp đồng API tương thích ngược.
1. **Chuyển đủ giao diện 5 tab** từ `sakuko-xuong-phan-mem/app/public/index.html` (khối "🏷️ Xưởng tem nhãn")
   sang `public/index.html` ở đây: tem giá 19 theme + gợi ý theo lịch, tem đồ ăn, tem nhãn phụ, mã vạch loạt,
   tem khuyến mại, nút ⬇ Excel mẫu, cổng duyệt trước in, 💾 bộ tem lưu lại. API phía sau đã sẵn cả 5.
2. **Cổng dữ liệu Lark**: chuyển endpoint `/api/lark-*` (đọc tồn kho qua lark-cli) từ server.js cũ sang Go
   (exec `~/bin/lark-cli` y như cũ, hoặc dùng SDK Go `oapi-sdk-go` — lark-cli chính là Go).
3. ✅ **XONG 15/07** — Bé Tem đã nằm trong repo này (`bot/bot-lark.js`), trỏ cổng 4200, THUẦN 0 token
   (bỏ tầng Claude — não = menu lệnh + FAQ file kiến thức + bộ bóc câu regex; cổng tra nguồn Lark NHÚNG
   trong bot qua lark-cli, cấu hình `bot/data/lark-nguon.json` — xem BAN-GIAO.md mục 6b). Máy bàn CEO
   đang chạy bản này qua launchd com.sakuko.betem. Bot cũ trong sakuko-xuong-phan-mem ngừng dùng.
4. **2 nút AI Gemini** (📷 đọc ảnh hoá đơn, 🪄 xếp danh sách): chuyển endpoint tương ứng, key đọc từ `~/.claude/.env`.
5. **Deploy server**: VPS hoặc server nội bộ — cần go binary + python3 + 3 lib pip + font (bundle Noto Sans/Be Vietnam Pro
   thay Arial, chỉnh `tem_lib.FONTP`). Kèm systemd/launchd KeepAlive.
6. Giai đoạn 2: Valkey (cache + queue), lịch sử in theo cửa hàng, phân quyền.

## Luật làm việc
- **1 máy sửa 1 lúc** — sửa xong `git push`; máy kia `git pull` trước khi đụng.
- Repo `sakuko-xuong-phan-mem` cũ GIỮ NGUYÊN module tem (đang chạy thật cho văn phòng) cho tới khi app này thay thế xong.
- Không commit `.env`, key, file trong `public/out/`.
