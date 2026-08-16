# 📦 BÀN GIAO — Xưởng tem nhãn Sakuko (v0.6)

> Tài liệu cho đội tiếp nhận. Đọc file này trước, rồi đọc `DOC-BAT-DAU.md` (chi tiết kỹ thuật + danh sách việc tiếp theo).
> Người bàn giao: CEO Dung Cao. Bản bàn giao: **v0.6** (tag git), 17/07/2026.
> Lịch sử bản: v0.2 web tem đủ tính năng · v0.3 Bé Tem về repo (0 token) · v0.4 Bé Tem có trí nhớ + xác nhận loạt lớn · v0.5 tầng AI Groq tuỳ chọn · v0.6 tầng AI thành vòng lặp Agent có tools.

## 1. Đây là gì
Web app in tem nhãn cho chuỗi CVS Sakuko: **tem giá kệ** (19 kiểu + badge tự do, khổ nẹp kệ 58×30 tới băng giá 210×100, A4 chia 2/4/6/9 tem lớn) · **tem đồ ăn tươi** (NSX/HSD tự tính, mã vạch EAN-13 nhúng giá chuẩn POS) · **tem nhãn phụ** · **mã vạch hàng loạt** (EAN-13/Code128/ITF-14/GS1-128/QR) · **tem khuyến mại** (chữ nhật cài nẹp kệ / sao gai dán sản phẩm).

Nhập liệu: dán text từng dòng hoặc **1 file Excel mẫu dùng chung cả 5 công cụ** (nút ⬇ trên trang). Xuất: PDF in cả loạt (tối đa 500 tem/lần) hoặc PNG xem thử/gửi Zalo.

## 2. Kiến trúc (1 phút)
```
Trình duyệt ──► main.go (Go thuần stdlib, cổng 4200)
                 ├─ phục vụ public/ (index.html 5 tab, Excel mẫu, /out ảnh+PDF sinh ra)
                 └─ 5 API POST /api/tem-gia · tem-doan · tem-nhan · ma-vach · tem-tang
                      └─ exec python3 scripts/<tên>.py  ──► PDF/PNG vào public/out/
```
- **Go = vỏ web** (validate input, gọi script, trả `{ok,url,info}` hoặc `{ok,items:[{url}]}`).
- **Python = engine vẽ tem** (`tem_lib.py` + 5 script) — đã nghiệm thu từng pixel, **đừng viết lại bằng Go**; muốn sửa hình thức tem thì sửa script Python.
- **Không database, không token AI, không key** — chạy hoàn toàn offline. Chi phí vận hành ≈ 0.

## 3. Chạy từ số 0 (máy mới tinh)
```bash
# yêu cầu: Go ≥1.23, Python 3.9+
git clone https://github.com/DungCaoSakuko/sakuko-xuong-tem.git
cd sakuko-xuong-tem
pip3 install python-barcode openpyxl pillow
go run .          # → mở http://localhost:4200
```
Kiểm nhanh: mở trang → tab Tem giá → bấm "👁 Xem thử 1 tem" với dữ liệu mẫu có sẵn → ra ảnh tem là máy ổn.

**Font chữ:** engine đang dùng **Arial** (macOS/Windows có sẵn). Deploy **Linux** phải cài font (vd `fonts-liberation` hoặc bundle Noto Sans/Be Vietnam Pro) rồi chỉnh đường dẫn trong `tem_lib.py` (biến `FONTP`). Đây là việc số 5 trong `DOC-BAT-DAU.md`.

## 4. Trạng thái bàn giao
| Phần | Trạng thái |
|---|---|
| 5 công cụ tem + 5 API | ✅ chạy thật, đã qua đội test nội bộ (11 góp ý đợt 1 đã xử lý hết) |
| Khổ nẹp kệ CVS 58×30, tem to đầu kệ, A4 chia ô, từ–đến ngày, badge tự do, trần 500 | ✅ v0.2 |
| Đăng nhập / phân quyền | ❌ CHƯA CÓ — bản test nội bộ, ai mở trang đều in được. **Phải thêm trước khi mở rộng** |
| Cổng dữ liệu Lark (gõ mã → tự điền tên/giá/mã vạch từ file tồn kho) | ❌ chưa chuyển sang app này (việc 2 trong DOC) |
| Deploy server công ty 24/7 | ❌ đang chạy tạm trên máy CEO (launchd + Tailscale) — đội nhận chọn VPS/server nội bộ (việc 5) |
| Bé Tem (bot Lark in tem qua chat) | ✅ trong repo (`bot/bot-lark.js`), trỏ app tem cổng 4200 — có **trí nhớ** (in lại / thêm N cái / đổi khổ; `/macdinh` từng nhóm), **xác nhận loạt lớn**, tầng **AI Agent tuỳ chọn** (Groq miễn phí, 4 tools) — xem mục 6b |

## 5. Việc đội nhận nên làm, theo thứ tự
1. **Chạy được trên máy dev** (mục 3) + đọc `DOC-BAT-DAU.md`.
2. **Deploy server công ty** (Linux): binary Go + python3 + 3 lib pip + font (mục 3) + systemd KeepAlive. Cân nhắc reverse proxy (nginx/caddy) + HTTPS nội bộ.
3. **Thêm đăng nhập/phân quyền** trước khi phát link cho cửa hàng (đơn giản nhất: basic auth theo cửa hàng, hoặc SSO Lark).
4. **Cổng dữ liệu Lark** (việc 2 DOC) — cần app Lark + scope đọc file, đội tự tạo app riêng của phòng.
5. Theo nhu cầu: lịch sử in theo cửa hàng, ZPL cho máy in tem nhiệt (chờ chốt model máy in), Valkey cache/queue (chỉ khi tải lớn — đừng thêm sớm).

## 6b. Bé Tem — bot Lark in tem qua chat (`bot/bot-lark.js`)
Nhắn trong nhóm Lark `@Bé Tem /tem pocari | 5 | 58x30 | km` → bot tra file nguồn → gọi app tem → gửi PDF vào chat. **Không dùng AI** — 3 tầng não đều bằng code: menu lệnh → FAQ (file kiến thức) → bộ bóc câu regex. Chi phí = 0.

**Chạy bot cần 3 thứ:**
1. App tem đang chạy (cổng 4200, mục 3).
2. **lark-cli** — CLI Go của Lark: build từ github.com/larksuite/cli (`go build -o ~/bin/lark-cli .`), rồi `lark-cli config init --app-id <app-id> --app-secret-stdin` (nhận app "Bé Tem" từ CEO — xem mục 6) và `lark-cli auth login`. Kiểm: `lark-cli auth status` → bot=ready.
3. Node.js ≥18 → `node bot/bot-lark.js` (chạy nền: systemd/launchd KeepAlive; **chỉ chạy 1 bản** — 2 bản cùng app sẽ trả lời trùng).

**Nối file tồn kho/DMHH (để lệnh `/tem <tên hàng>` tra được giá + mã vạch):** tạo `bot/data/lark-nguon.json` (gitignore, mỗi máy 1 bản):
```json
{ "token": "<token file sheet Lark>", "tieude": "Tên file", "sheetId": "<sheet id>",
  "hangTieuDe": 2, "cols": { "ten": 1, "gia": 5, "barcode": 3, "ma_noibo": 2 },
  "rowCount": 3000, "tuDong": false }
```
(`cols` = chỉ số cột tính từ 0; `tuDong:true` + `spaceId`/`parentNode` = tự dùng file mới nhất trong thư mục wiki.) Chưa có file này thì bot vẫn chạy — chỉ lệnh tra-theo-tên báo "chưa nối nguồn"; lệnh `/temkm` và tra cứu khổ/kiểu/FAQ vẫn đủ.

**Trí nhớ & an toàn (có sẵn, 0 đồng):** bot nhớ lệnh in gần nhất từng nhóm ("in lại", "thêm 5 cái nữa", "đổi khổ 58x30", "kiểu tet"); `/macdinh khổ 58x30 kiểu km` đặt mặc định riêng từng nhóm (lưu `bot/data/be-tem-nho.json`, gitignore); loạt in lớn (>20 mặt hàng hoặc >120 tem) bot dừng hỏi lại, gõ "ok" mới chạy.

**Huấn luyện bot:** sửa `bot/data/be-tem-kien-thuc.md` (định dạng `Hỏi: cách hỏi 1 | cách hỏi 2` / `Đáp: ...`) → restart bot. Thêm FAQ = thêm cặp Hỏi/Đáp, không cần sửa code. Mỗi cách-hỏi nên có **≥2 từ khoá có nghĩa** (bot bỏ qua cách-hỏi quá ngắn để tránh khớp bừa).

**Não AI tuỳ chọn (kiến trúc "luật trước — AI sau"):** các tầng luật (menu/FAQ/trí nhớ/regex) chạy 0 đồng; câu tự nhiên khó có thể giao thêm cho **Groq** (API MIỄN PHÍ): lấy key tại console.groq.com → đặt `GROQ_API_KEY=...` vào biến môi trường hoặc `~/.claude/.env` trên máy chạy bot → restart. Không có key bot vẫn chạy đủ lệnh, chỉ kém khoản "hiểu câu nói vòng vo". Model đổi bằng env `GROQ_MODEL` (mặc định llama-3.3-70b-versatile).

**Tầng AI chạy theo VÒNG LẶP AGENT có tools** (không phải hỏi-đáp 1 phát): AI được cấp 4 tool — `tra_hang` (tra tồn kho THẬT trước khi nói về hàng/giá, chống bịa) · `in_tem` · `in_temkm` · `tra_loi` (kết thúc) — tối đa 5 vòng. AI chỉ được trả **Ý ĐỊNH**: tham số qua bộ lọc `lamSachY`, thao tác in vẫn đi đường lệnh chuẩn, loạt lớn vẫn phải "ok" xác nhận. **Test vòng lặp không cần key/mạng:** `BETEM_MOCK_GROQ=<file kịch bản .json> node bot/bot-lark.js --test "câu thử"` (file = mảng các response Groq giả, xem ví dụ trong lịch sử commit).

## 6. Ranh giới sở hữu — cái gì KHÔNG đi theo repo
- Repo này **tự đủ**: không chứa secret, không phụ thuộc ClaudeKit hay tài khoản Claude/Gemini của CEO.
- **Không nhận được từ CEO**: máy chạy hiện tại (máy cá nhân), địa chỉ Tailscale `sakuko-xuong.tail117e8c.ts.net` (tài khoản cá nhân — sẽ tắt sau khi đội deploy xong).
- **App Lark "Bé Tem"** (app id `cli_aadee38362389ed4`): CEO sẽ thêm người của đội làm **Collaborator** trong Lark Developer Console, và **chuyển owner hẳn** sau khi đội vận hành ổn — khi đó App Secret do đội giữ.
- Cần môi trường mới (server, domain, tài khoản deploy) → đội tự tạo bằng tài khoản của phòng/công ty.

## 7. Luật làm việc trên repo
- Mỗi thời điểm **1 người sửa** → sửa xong push ngay; người khác pull trước khi đụng.
- **Không commit**: secret/`.env`, file sinh ra trong `public/out/`.
- Sửa hình thức tem → sửa `scripts/*.py` (test bằng lệnh trực tiếp, xem usage đầu mỗi file); sửa API/validate → `main.go`; sửa giao diện → `public/index.html`.
- Giữ **tương thích ngược hợp đồng API** (bản cũ trong hệ Xưởng lớn + Bé Tem đang gọi đúng hợp đồng này).
- Có gì hỏi CEO Dung Cao (chủ repo) — hoặc mở issue trong repo này.

## 8. Tra cứu nhanh
| Cần | Xem |
|---|---|
| Chi tiết kỹ thuật + việc còn lại | `DOC-BAT-DAU.md` |
| Tham số từng script tem | Chú thích đầu mỗi file `scripts/*.py` |
| Hợp đồng 5 API | Chú thích đầu `main.go` + handler từng route |
| Mẫu nhập liệu | Nút "⬇ Tải Excel mẫu" trên trang (public/mau-tem-nhan.xlsx) |
| Sổ góp ý người dùng đợt 1 (đã xử lý) | `GOP-Y-NHAN-VIEN.md` trong repo `sakuko-xuong-phan-mem` (hỏi CEO nếu cần) |
