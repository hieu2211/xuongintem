// Xưởng tem nhãn Sakuko — web app riêng (Go làm vỏ, Python vẽ tem — phương án A).
// Chạy: go run .   (cổng 4200) — cần python3 + pip3 install python-barcode openpyxl pillow + font Arial.
// Hợp đồng API GIỮ NGUYÊN như module tem trong sakuko-xuong-phan-mem (để giao diện + Bé Tem dùng lại được):
//   POST /api/tem-gia | /api/tem-doan | /api/tem-nhan | /api/ma-vach  (multipart: text|file, logo?, tham số)
//   POST /api/tem-tang (form thường)  →  {ok,url,info} hoặc {ok,items:[{url}]} / {error}
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"
)

const port = "4200"

var (
	rootDir    string
	scriptsDir string
	outDir     string
	khoRe      = regexp.MustCompile(`^[0-9a-zA-Zx-]{2,8}$`) // dấu "-" cho a4-2/a4-4/a4-6/a4-9 (A4 chia ô tem lớn)
)

func jsonErr(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
func jsonOK(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func khoSach(s, macdinh string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	if khoRe.MatchString(s) {
		return s
	}
	return macdinh
}
func soTrong(s string, min, max, macdinh int) int {
	n, err := strconv.Atoi(strings.TrimSpace(s))
	if err != nil {
		n = macdinh
	}
	if n < min {
		n = min
	}
	if n > max {
		n = max
	}
	return n
}

// lưu file upload (giữ đuôi gốc để python nhận dạng Excel) vào thư mục tạm; trả "" nếu không có
func luuUpload(r *http.Request, field string) (string, error) {
	f, fh, err := r.FormFile(field)
	if err != nil {
		return "", nil // không đính file — bình thường
	}
	defer f.Close()
	dst := filepath.Join(os.TempDir(), fmt.Sprintf("tem-%s-%d%s", field, time.Now().UnixNano(), filepath.Ext(fh.Filename)))
	out, err := os.Create(dst)
	if err != nil {
		return "", err
	}
	defer out.Close()
	if _, err := io.Copy(out, f); err != nil {
		return "", err
	}
	return dst, nil
}

// chạy script tem: nhận Excel (field file) hoặc text dán (field text) + logo tuỳ chọn → PDF/PNG trong public/out
func runTem(w http.ResponseWriter, r *http.Request, script string, extraArgs func(logo string) []string, ext, prefix string) {
	r.ParseMultipartForm(30 << 20)
	text := strings.TrimSpace(r.FormValue("text"))
	excel, err1 := luuUpload(r, "file")
	logo, err2 := luuUpload(r, "logo")
	var temps []string
	if excel != "" {
		temps = append(temps, excel)
	}
	if logo != "" {
		temps = append(temps, logo)
	}
	defer func() {
		for _, t := range temps {
			os.Remove(t)
		}
	}()
	if err1 != nil || err2 != nil {
		jsonErr(w, 500, "Không lưu được file đính kèm.")
		return
	}
	if excel == "" && text == "" {
		jsonErr(w, 400, "Bạn đính file Excel theo mẫu (hoặc dán danh sách) trước đã nhé.")
		return
	}
	input := excel
	if input == "" {
		tmp := filepath.Join(os.TempDir(), fmt.Sprintf("ds-%d.txt", time.Now().UnixNano()))
		if err := os.WriteFile(tmp, []byte(text), 0o644); err != nil {
			jsonErr(w, 500, "Không ghi được dữ liệu tạm.")
			return
		}
		temps = append(temps, tmp)
		input = tmp
	}
	os.MkdirAll(outDir, 0o755)
	name := fmt.Sprintf("%s-%d%s", prefix, time.Now().UnixMilli(), ext)
	dest := filepath.Join(outDir, name)
	logoArg := "-"
	if logo != "" {
		logoArg = logo
	}
	args := append([]string{"-W", "ignore", filepath.Join(scriptsDir, script), input, dest}, extraArgs(logoArg)...)
	cmd := exec.Command("python3", args...)
	stdout, err := cmd.Output() // chỉ đọc stdout (stderr có thể lẫn warning)
	line := ""
	if ls := strings.Split(strings.TrimSpace(string(stdout)), "\n"); len(ls) > 0 {
		line = strings.TrimSpace(ls[len(ls)-1])
	}
	if strings.HasPrefix(line, "OKPNG") { // xuất PNG: mỗi tem 1 ảnh đánh số <gốc>-i.png
		n, _ := strconv.Atoi(strings.TrimSpace(line[5:]))
		goc := strings.TrimSuffix(name, ext)
		var items []map[string]string
		for i := 0; i < n; i++ {
			f := fmt.Sprintf("%s-%d.png", goc, i)
			if _, e := os.Stat(filepath.Join(outDir, f)); e == nil {
				items = append(items, map[string]string{"url": "/out/" + f})
			}
		}
		if len(items) > 0 {
			jsonOK(w, map[string]any{"ok": true, "items": items})
			return
		}
		jsonErr(w, 500, "Xuất PNG thất bại.")
		return
	}
	if strings.HasPrefix(line, "OK") {
		if st, e := os.Stat(dest); e == nil {
			info := strings.TrimSpace(strings.TrimPrefix(line, "OK"))
			jsonOK(w, map[string]any{"ok": true, "url": "/out/" + name, "info": fmt.Sprintf("%s · %d KB", info, st.Size()/1024)})
			return
		}
	}
	msg := strings.TrimSpace(strings.TrimPrefix(line, "ERR:"))
	if msg == "" {
		msg = "Tạo thất bại."
		if err != nil {
			msg = "Tạo thất bại (python lỗi — đã cài python-barcode + openpyxl + pillow chưa?)."
		}
	}
	jsonErr(w, 500, msg)
}

func main() {
	rootDir, _ = os.Getwd()
	if len(os.Args) > 1 { // cho phép chỉ định thư mục repo khi chạy từ nơi khác / launchd
		rootDir = os.Args[1]
	}
	scriptsDir = filepath.Join(rootDir, "scripts")
	outDir = filepath.Join(rootDir, "public", "out")

	themeOK := map[string]bool{"standard": true, "promotion": true, "new": true, "bestseller": true, "seasonal": true,
		"xuan": true, "ha": true, "thu": true, "dong": true, "khaitruong": true, "tet": true, "83": true, "2010": true,
		"trungthu": true, "tuutruong": true, "nhagiao": true, "noel": true, "dovang": true, "vangdo": true, "dotrang": true}

	// 1) Tem giá kệ
	http.HandleFunc("/api/tem-gia", func(w http.ResponseWriter, r *http.Request) {
		kho := khoSach(r.FormValue("kho"), "a4")
		theme := strings.TrimSpace(r.FormValue("theme"))
		if !themeOK[theme] {
			theme = "standard"
		}
		xemthu := r.FormValue("xemthu") == "1"
		xuat := "pdf"
		if xemthu || r.FormValue("xuat") == "png" {
			xuat = "png"
		}
		batdau := soTrong(r.FormValue("batdau"), 1, 24, 1)
		hsd := "0"
		if r.FormValue("hsd") == "1" {
			hsd = "1"
		}
		xt := "0"
		if xemthu {
			xt = "1"
		}
		ext := ".pdf"
		if xuat == "png" {
			ext = ".png"
		}
		// từ–đến ngày áp cả loạt + chữ badge tự do (HOT/NEW/TOP GIÁ SỐC...) — "-" nghĩa là bỏ qua
		lamSach := func(v string, re *regexp.Regexp, max int) string {
			v = strings.TrimSpace(v)
			if v == "" || !re.MatchString(v) {
				return "-"
			}
			if len(v) > max {
				v = v[:max]
			}
			return v
		}
		ngayRe := regexp.MustCompile(`^[0-9/.-]{3,12}$`)
		badgeRe := regexp.MustCompile(`^[^|\r\n]{1,30}$`)
		tu := lamSach(r.FormValue("tu"), ngayRe, 12)
		den := lamSach(r.FormValue("den"), ngayRe, 12)
		badge := lamSach(r.FormValue("badge"), badgeRe, 30)
		runTem(w, r, "tem-gia-le.py", func(lg string) []string {
			return []string{lg, kho, theme, xuat, strconv.Itoa(batdau), xt, hsd, tu, den, badge}
		}, ext, "temgia")
	})

	// 2) Tem đồ ăn tươi (EAN-13 nhúng giá + NSX/HSD)
	http.HandleFunc("/api/tem-doan", func(w http.ResponseWriter, r *http.Request) {
		kho := khoSach(r.FormValue("kho"), "50x30")
		xemthu := r.FormValue("xemthu") == "1"
		batdau := soTrong(r.FormValue("batdau"), 1, 24, 1)
		prefix := strings.TrimSpace(r.FormValue("prefix"))
		if m, _ := regexp.MatchString(`^2\d$`, prefix); !m {
			prefix = "20"
		}
		xt, ext := "0", ".pdf"
		if xemthu {
			xt, ext = "1", ".png"
		}
		runTem(w, r, "tem-doan-le.py", func(lg string) []string {
			return []string{lg, kho, strconv.Itoa(batdau), xt, prefix}
		}, ext, "temdoan")
	})

	// 3) Tem nhãn phụ
	http.HandleFunc("/api/tem-nhan", func(w http.ResponseWriter, r *http.Request) {
		kho := khoSach(r.FormValue("kho"), "100x70")
		xemthu := r.FormValue("xemthu") == "1"
		batdau := soTrong(r.FormValue("batdau"), 1, 8, 1)
		xt, ext := "0", ".pdf"
		if xemthu {
			xt, ext = "1", ".png"
		}
		runTem(w, r, "tem-nhan-le.py", func(lg string) []string {
			return []string{lg, kho, strconv.Itoa(batdau), xt}
		}, ext, "temnhan")
	})

	// 4) Mã vạch hàng loạt
	http.HandleFunc("/api/ma-vach", func(w http.ResponseWriter, r *http.Request) {
		runTem(w, r, "ma-vach-le.py", func(lg string) []string { return []string{lg} }, ".pdf", "mavach")
	})

	// 5) Tem DÁN khuyến mại (hàng tặng hàng) — không nhận file, chỉ tham số
	http.HandleFunc("/api/tem-tang", func(w http.ResponseWriter, r *http.Request) {
		r.ParseMultipartForm(1 << 20)
		text := strings.TrimSpace(r.FormValue("text"))
		if len(text) > 60 {
			text = text[:60]
		}
		if text == "" {
			jsonErr(w, 400, "Bạn chọn hoặc nhập nội dung tem trước đã nhé (vd MUA 1|TẶNG 1).")
			return
		}
		hinh := r.FormValue("hinh")
		if hinh != "sao" && hinh != "tron" && hinh != "bong" && hinh != "nhat" {
			hinh = "sao"
		}
		mau := r.FormValue("mau")
		if mau != "do" && mau != "vang" && mau != "trang" {
			mau = "vang"
		}
		kich := khoSach(r.FormValue("kich"), "50x50")
		sl := soTrong(r.FormValue("sl"), 1, 240, 24)
		xuat := "pdf"
		if r.FormValue("xuat") == "png" {
			xuat = "png"
		}
		batdau := soTrong(r.FormValue("batdau"), 1, 96, 1)
		ext := ".pdf"
		if xuat == "png" {
			ext = ".png"
		}
		os.MkdirAll(outDir, 0o755)
		name := fmt.Sprintf("temtang-%d%s", time.Now().UnixMilli(), ext)
		dest := filepath.Join(outDir, name)
		cmd := exec.Command("python3", "-W", "ignore", filepath.Join(scriptsDir, "tem-tang-le.py"),
			dest, text, hinh, mau, kich, strconv.Itoa(sl), xuat, strconv.Itoa(batdau))
		stdout, _ := cmd.Output()
		line := ""
		if ls := strings.Split(strings.TrimSpace(string(stdout)), "\n"); len(ls) > 0 {
			line = strings.TrimSpace(ls[len(ls)-1])
		}
		if strings.HasPrefix(line, "OKPNG") {
			f := strings.TrimSuffix(name, ext) + "-0.png"
			if _, e := os.Stat(filepath.Join(outDir, f)); e == nil {
				jsonOK(w, map[string]any{"ok": true, "items": []map[string]string{{"url": "/out/" + f}}})
				return
			}
			jsonErr(w, 500, "Xuất PNG thất bại.")
			return
		}
		if strings.HasPrefix(line, "OK") {
			if st, e := os.Stat(dest); e == nil {
				jsonOK(w, map[string]any{"ok": true, "url": "/out/" + name,
					"info": fmt.Sprintf("%s · %d KB", strings.TrimSpace(strings.TrimPrefix(line, "OK")), st.Size()/1024)})
				return
			}
		}
		jsonErr(w, 500, strings.TrimSpace(strings.TrimPrefix(line, "ERR:")))
	})

	// tĩnh: giao diện + file tem đã tạo
	http.Handle("/", http.FileServer(http.Dir(filepath.Join(rootDir, "public"))))

	log.Println("🏷️ Xưởng tem nhãn Sakuko (Go) chạy tại http://localhost:" + port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
