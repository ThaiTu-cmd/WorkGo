# ==============================================================================
# WorkGo Platform - Kich Ban Benchmark FPS & Kiem Thu Hieu Nang (v9.0.0)
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  WORKGO PLATFORM - KIEM THU HIEU NANG & BENCHMARK FPS THOI GIAN THUC  " -ForegroundColor Cyan
Write-Host "  Phien ban: 9.0.0 (High-Performance Engine, Zero-Jank & GPU Pacing)   " -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Kiem tra trang thai may chu Next.js
$frontendUrl = "http://localhost:3000"
Write-Host "[1/3] Dang kiem tra ket noi toi may chu Frontend ($frontendUrl)..." -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "$frontendUrl/vi" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  [OK] May chu Frontend dang hoat dong binh thuong (HTTP $($response.StatusCode))." -ForegroundColor Green
} catch {
    Write-Host "  [CANH BAO] Khong ket noi duoc toi $frontendUrl!" -ForegroundColor Red
    Write-Host "  Vui long khoi dong Next.js: cd website-frontend; npm run dev" -ForegroundColor Yellow
    Write-Host ""
}

# 2. Mo cac trang can do dac FPS tren trinh duyet
Write-Host "[2/3] Dang mo cac trang kiem thu hieu nang tren trinh duyet..." -ForegroundColor White

$landingUrl   = "$frontendUrl/vi"
$loginUrl     = "$frontendUrl/vi/login"
$dashboardUrl = "$frontendUrl/vi/client"

Write-Host "  -> Mo Landing Page (Three.js & Ocean Canvas): $landingUrl" -ForegroundColor Gray
Start-Process $landingUrl

Start-Sleep -Milliseconds 800

Write-Host "  -> Mo Auth Login (Particle Physics & Zero Regex): $loginUrl" -ForegroundColor Gray
Start-Process $loginUrl

Start-Sleep -Milliseconds 800

Write-Host "  -> Mo Client Dashboard (Path-Batched Ambient Ocean): $dashboardUrl" -ForegroundColor Gray
Start-Process $dashboardUrl

Write-Host "  [OK] Da khoi chay 3 tab trinh duyet thanh cong." -ForegroundColor Green
Write-Host ""

# 3. Huong dan chi tiet danh cho TESTER
Write-Host "[3/3] QUY TRINH VA TIEU CHUAN NGHIEM THU DANH CHO QA / TESTER:" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray

Write-Host "BUOC 1: LANDING PAGE (http://localhost:3000/vi)" -ForegroundColor Yellow
Write-Host "  1. Nhan F12 -> Nhan Ctrl + Shift + P -> Go 'Show frames per second (FPS) meter'."
Write-Host "  2. Cuon nhanh chuot tu dau trang xuong chan trang (Footer) va nguoc lai."
Write-Host "  * TIEU CHUAN: FPS duy tri on dinh 55 - 60 FPS, khong bi khung giat, qua cau 3D quay muot ma."
Write-Host ""

Write-Host "BUOC 2: MAN HINH DANG NHAP (http://localhost:3000/vi/login)" -ForegroundColor Yellow
Write-Host "  1. Di chuyen chuot xung quanh form card de kich hoat luc day tu tinh."
Write-Host "  2. Quan sat do muot cua cac duong noi va cac cham hat."
Write-Host "  * TIEU CHUAN: Hoan toan triet tieu cac micro-stutters do Garbage Collection nho loai bo Regex."
Write-Host ""

Write-Host "BUOC 3: DASHBOARD KHACH HANG (http://localhost:3000/vi/client)" -ForegroundColor Yellow
Write-Host "  1. Cuon xem danh sach cong viec va thong ke."
Write-Host "  2. Nhan thu nut mo menu hoac go phim vao o tim kiem."
Write-Host "  * TIEU CHUAN: Luoi song am em diu, chi gom 3 draw calls/frame (giam 99.7% so voi truoc day)."
Write-Host ""

Write-Host "BUOC 4: KIEM TRA TIET KIEM TAI NGUYEN KHI AN TAB (VISIBILITY SUSPENSION)" -ForegroundColor Yellow
Write-Host "  1. Mo DevTools tab 'Performance' hoac Task Manager cua Windows."
Write-Host "  2. Chuyen sang mot tab trinh duyet khac trong 5 giay de WorkGo vao che do background."
Write-Host "  3. Chuyen lai tab WorkGo."
Write-Host "  * TIEU CHUAN: Trong thoi gian tab bi an, muc tieu thu CPU/GPU cua tab WorkGo ve 0%, khong render du thua."
Write-Host ""

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  HOAN TAT KHOI CHAY BENCHMARK HIEU NANG WORKGO PLATFORM!              " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
